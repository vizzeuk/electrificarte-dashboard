"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentVendor, isActiveVendor } from "@/lib/auth/vendor";
import type { NuevaOfertaInput, VersionMatch } from "@/lib/db/types";

const VERSION_MATCH: VersionMatch[] = [
  "exacta",
  "variacion_menor",
  "upgrade",
  "inferior",
  "no_coincidente",
];

export type CrearOfertaResult = { ok: true } | { ok: false; error: string };

/**
 * Inserta una puja en `ofertas` con estado 'pendiente'. El insert dispara el
 * Database Webhook → n8n (cuando esté configurado). El dashboard NO calcula score
 * ni llama endpoints de la subasta: el backend llena cercania/precio_publicado/
 * score/estado final.
 *
 * Seguridad: valida sesión + vendedor activo server-side y fuerza vendor_id al del
 * logueado. Además la RLS de `ofertas` (with check vendor_id = current_vendor_id()
 * and estado = 'pendiente') es la última barrera.
 */
export async function crearOferta(
  input: NuevaOfertaInput,
): Promise<CrearOfertaResult> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { ok: false, error: "No autorizado." };
  if (!isActiveVendor(vendor))
    return { ok: false, error: "Tu cuenta no está activa." };

  // Validación de payload.
  if (!Number.isFinite(input.lead_id))
    return { ok: false, error: "Lead inválido." };
  if (!(input.precio_oferta > 0))
    return { ok: false, error: "El precio ofertado debe ser mayor a 0." };
  if (!(input.horas_entrega > 0 && input.horas_entrega <= 96))
    return { ok: false, error: "Las horas de entrega deben estar entre 1 y 96." };
  if (!VERSION_MATCH.includes(input.version_match))
    return { ok: false, error: "Tipo de coincidencia inválido." };
  if (!input.marca_ofertada.trim() || !input.modelo_ofertado.trim())
    return { ok: false, error: "Declará marca y modelo del vehículo." };
  if (!(input.anio_ofertado >= 1990 && input.anio_ofertado <= 2100))
    return { ok: false, error: "Año del vehículo inválido." };

  const supabase = await createClient();
  // El financiamiento NO se manda: el backend lo deriva del perfil del vendedor.
  const { error } = await supabase.from("ofertas").insert({
    lead_id: input.lead_id,
    vendor_id: vendor.id,
    precio_oferta: Math.round(input.precio_oferta),
    horas_entrega: Math.round(input.horas_entrega),
    version_match: input.version_match,
    valor_regalias: Math.round(input.valor_regalias || 0),
    regalias_descripcion: input.regalias_descripcion?.trim() || null,
    marca_ofertada: input.marca_ofertada.trim(),
    modelo_ofertado: input.modelo_ofertado.trim(),
    anio_ofertado: input.anio_ofertado,
    color_ofertado: input.color_ofertado?.trim() || null,
    estado: "pendiente",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/vendedor/leads-disponibles");
  revalidatePath("/vendedor/leads-activos");
  return { ok: true };
}
