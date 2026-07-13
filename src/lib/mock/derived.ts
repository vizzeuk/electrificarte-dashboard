import { leadsOferta, CURRENT_VENDEDOR_ID } from "./leads-oferta";
import { vendedores } from "./vendedores";

/** Leads ya asignados al vendedor actual (vista /vendedor). */
export function leadsActivosVendedor() {
  return leadsOferta.filter((l) => l.vendedorId === CURRENT_VENDEDOR_ID);
}

/** Leads pagados y aún sin vendedor asignado — pool disponible para ofertar. */
export function leadsDisponiblesVendedor() {
  return leadsOferta.filter((l) => l.estado === "pagado" && !l.vendedorId);
}

export function vendedorActual() {
  return vendedores.find((v) => v.id === CURRENT_VENDEDOR_ID)!;
}

export function vendedoresActivos() {
  return vendedores.filter((v) => v.activo);
}

export function totalLeadsOfertados() {
  return vendedores.reduce((sum, v) => sum + v.leadsOfertados, 0);
}

export function tasaRespuestaPromedio() {
  const activos = vendedoresActivos();
  if (activos.length === 0) return 0;
  return Math.round(activos.reduce((sum, v) => sum + v.tasaRespuesta, 0) / activos.length);
}
