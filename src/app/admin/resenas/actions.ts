"use server";

import { revalidatePath } from "next/cache";
import { getAdminEmail } from "@/lib/auth/admin";
import { createServiceClient } from "@/lib/supabase/service";

export type ModerarResult =
  | { ok: true; aviso?: string }
  | { ok: false; error: string };

/** Base del sitio que publica las fotos aprobadas. Default: producción. */
const API_BASE = process.env.ELECTRIFICARTE_API_BASE ?? "https://www.electrificarte.com";

/**
 * Aprueba una reseña y publica sus fotos.
 *
 * El `.eq("status","pendiente")` hace el UPDATE idempotente: si hay doble clic o dos personas
 * moderando a la vez, solo la primera afecta la fila (verificamos cuántas se afectaron). La
 * publicación de fotos se llama DESPUÉS del update — si se llamara antes, el endpoint responde
 * 409 y no mueve nada (el bucket público nunca debe tener contenido sin moderar).
 */
export async function aprobarResena(id: string): Promise<ModerarResult> {
  const admin = await getAdminEmail();
  if (!admin) return { ok: false, error: "No autorizado." };

  const db = createServiceClient();
  const { data, error } = await db
    .from("reviews")
    .update({ status: "aprobada", moderated_at: new Date().toISOString(), moderated_by: admin })
    .eq("id", id)
    .eq("status", "pendiente")
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "La reseña ya había sido moderada." };
  }

  // Publicar las fotos (mueve del bucket privado al público). Idempotente.
  let aviso: string | undefined;
  try {
    const res = await fetch(`${API_BASE}/api/reviews/publish`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-admin-secret": process.env.ADMIN_API_SECRET ?? "",
      },
      body: JSON.stringify({ reviewId: id }),
    });
    if (!res.ok) {
      aviso = `Se aprobó, pero la publicación de fotos falló (HTTP ${res.status}). La reseña puede aparecer sin fotos — reintentá la publicación.`;
    }
  } catch {
    aviso = "Se aprobó, pero no se pudo contactar el servicio que publica las fotos. Reintentá más tarde.";
  }

  revalidatePath("/admin/resenas");
  return { ok: true, aviso };
}

/** Rechaza una reseña (no publica nada). Mismo candado idempotente. */
export async function rechazarResena(id: string, motivo?: string): Promise<ModerarResult> {
  const admin = await getAdminEmail();
  if (!admin) return { ok: false, error: "No autorizado." };

  const db = createServiceClient();
  const { data, error } = await db
    .from("reviews")
    .update({
      status: "rechazada",
      moderated_at: new Date().toISOString(),
      moderated_by: admin,
      reject_reason: motivo?.trim() || null,
    })
    .eq("id", id)
    .eq("status", "pendiente")
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "La reseña ya había sido moderada." };
  }

  revalidatePath("/admin/resenas");
  return { ok: true };
}
