import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_MODE, previewPool, previewOfertas } from "@/lib/mock/preview";
import type { Oferta, PoolLead } from "@/lib/db/types";

/**
 * Pool de leads disponibles (vista sin PII). Visible para todo vendedor activo
 * por igual — no hay asignación 1:1. RLS/grant de la vista lo permite.
 */
export async function getPoolLeads(): Promise<PoolLead[]> {
  if (PREVIEW_MODE) return previewPool(); // PREVIEW_MODE
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads_pool")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getPoolLeads:", error.message);
    return [];
  }
  return (data ?? []) as PoolLead[];
}

/**
 * Ofertas del vendedor logueado (RLS: solo devuelve las suyas), más recientes
 * primero. Es la fuente de la pestaña "Mis ofertas".
 */
export async function getMisOfertas(): Promise<Oferta[]> {
  if (PREVIEW_MODE) return previewOfertas(); // PREVIEW_MODE
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ofertas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getMisOfertas:", error.message);
    return [];
  }
  return (data ?? []) as Oferta[];
}
