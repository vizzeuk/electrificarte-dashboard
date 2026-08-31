"use server";

import { revalidatePath } from "next/cache";
import { getCurrentVendor } from "@/lib/auth/vendor";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Campos que el vendedor puede rectificar de su propio perfil (derecho de
 * rectificación, Ley 21.719). Excluye a propósito identidad/suscripción:
 * email (es la llave de sesión), rut, estado, id, user_id — esos los controla
 * Electrificarte, no el vendedor.
 */
const CAMPOS_EDITABLES = [
  "nombre",
  "apellido",
  "nombre_concesionario",
  "telefono",
  "region",
  "comuna",
  "marcas",
] as const;

type CampoEditable = (typeof CAMPOS_EDITABLES)[number];
export type MisDatosInput = Partial<Record<CampoEditable, string>>;
export type ActualizarResult = { ok: true } | { ok: false; error: string };

/**
 * Actualiza los datos personales del vendedor logueado. La identidad se resuelve
 * server-side con la sesión (getCurrentVendor lee su fila vía RLS); recién con esa
 * identidad se escribe con service role SOLO su propia fila y SOLO campos permitidos.
 */
export async function actualizarMisDatos(input: MisDatosInput): Promise<ActualizarResult> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "No autorizado." };

  // Solo campos permitidos; "" se guarda como null.
  const patch: Record<string, string | null> = {};
  for (const campo of CAMPOS_EDITABLES) {
    const val = input[campo];
    if (val === undefined) continue;
    const v = String(val).trim();
    patch[campo] = v === "" ? null : v;
  }
  if (Object.keys(patch).length === 0) return { ok: false, error: "No hay cambios para guardar." };

  const db = createServiceClient();
  const { error } = await db.from("leads_vendors").update(patch).eq("id", vendor.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/vendedor/mi-cuenta");
  return { ok: true };
}
