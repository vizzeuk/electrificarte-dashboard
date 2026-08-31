import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface ConcesionarioVentas {
  concesionario: string;
  region: string | null;
  ventas: number;
}

/**
 * Ranking de concesionarios por ventas cerradas, agregado desde `ofertas`. Se considera
 * "venta cerrada" una oferta aceptada por el cliente (`estado = 'aceptada'` o `aceptada_at`).
 * Devuelve solo agregados sin PII (nombre del comercio + conteo), por eso se puede mostrar
 * igual a admin y a vendedores en la analítica del sitio. Usa service role para agregar sobre
 * toda la red (la RLS de `ofertas` limita a cada vendedor a las suyas).
 */
export async function getTopConcesionarios(limit = 5): Promise<ConcesionarioVentas[]> {
  const db = createServiceClient();

  const { data: ofertas, error } = await db
    .from("ofertas")
    .select("vendor_id, estado, aceptada_at");
  if (error) {
    console.error("getTopConcesionarios/ofertas:", error.message);
    return [];
  }

  const ventasPorVendor = new Map<string, number>();
  for (const o of ofertas ?? []) {
    const cerrada = o.estado === "aceptada" || o.aceptada_at != null;
    if (!cerrada || !o.vendor_id) continue;
    ventasPorVendor.set(o.vendor_id, (ventasPorVendor.get(o.vendor_id) ?? 0) + 1);
  }
  if (ventasPorVendor.size === 0) return [];

  const { data: vendedores } = await db
    .from("leads_vendors")
    .select("id, nombre_concesionario, region");
  const info = new Map((vendedores ?? []).map((v) => [v.id, v]));

  return [...ventasPorVendor.entries()]
    .map(([id, ventas]) => ({
      concesionario: info.get(id)?.nombre_concesionario ?? "Concesionario",
      region: info.get(id)?.region ?? null,
      ventas,
    }))
    .sort((a, b) => b.ventas - a.ventas)
    .slice(0, limit);
}
