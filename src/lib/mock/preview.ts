// ⚠️⚠️ TEMPORAL — PREVIEW SIN BACKEND ⚠️⚠️
// Deja ver el panel con datos de ejemplo mientras NO hay .env de Supabase.
// PARA BORRAR cuando se conecte el backend:
//   1. Eliminá este archivo.
//   2. `grep -rn PREVIEW_MODE src` y quitá cada guarda de una línea que aparezca.
// El flag se auto-desactiva apenas exista NEXT_PUBLIC_SUPABASE_URL (en prod siempre existe),
// así que esto nunca corre en producción — pero igual conviene borrarlo.

import type { VendorRow } from "@/lib/auth/vendor";
import type { PoolLead, Oferta } from "@/lib/db/types";
import type { AdminLead, AdminVendedor, AdminOverview } from "@/lib/data/admin-data";

/** true cuando no hay backend configurado (dev sin .env). */
export const PREVIEW_MODE = !process.env.NEXT_PUBLIC_SUPABASE_URL;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const iso = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString();

/** Vendedor demo. Sus `marcas` cruzan con los modelos en tendencia para que los tips
 *  se vean personalizados (BYD Seal / Tesla Model 3 / Kia EV6 son de estas marcas). */
export const previewVendor: VendorRow = {
  id: "preview-v1",
  nombre: "AutoMax",
  apellido: "Ñuñoa",
  email: "demo@electrificarte.cl",
  telefono: "+56 9 1234 5678",
  nombre_concesionario: "AutoMax Ñuñoa",
  comuna: "Ñuñoa",
  region: "Metropolitana",
  marcas: "BYD, Tesla, Kia",
  estado: "activo",
  rut_vendors: "76.123.456-7",
  user_id: "preview-user",
};

const poolBase = {
  status: "pagado" as string | null,
  cerrada_at: null as string | null,
  financing: "Contado" as string | null,
  parte_pago_marca: null as string | null,
  parte_pago_modelo: null as string | null,
  parte_pago_ano: null as string | null,
  parte_pago_km: null as string | null,
  parte_pago_duenos: null as string | null,
  parte_pago_deuda: null as string | null,
};

/** Pool con `cierra_at` relativo a ahora → cubre crítico / urgente / normal / sin límite / cerrado. */
export function previewPool(): PoolLead[] {
  return [
    { ...poolBase, id: 9001, created_at: iso(-2 * DAY), target_model: "BYD Seal", region: "Metropolitana", comuna: "Providencia", financing: "Crédito automotriz", parte_pago_marca: "Toyota", parte_pago_modelo: "Corolla", parte_pago_ano: "2019", parte_pago_km: "62.000", parte_pago_duenos: "1", parte_pago_deuda: "Sin deuda", cierra_at: iso(3 * HOUR) },
    { ...poolBase, id: 9002, created_at: iso(-1 * DAY), target_model: "Tesla Model 3", region: "Metropolitana", comuna: "Las Condes", cierra_at: iso(18 * HOUR) },
    { ...poolBase, id: 9003, created_at: iso(-1 * DAY), target_model: "Kia EV6", region: "Valparaíso", comuna: "Viña del Mar", financing: "Leasing", parte_pago_marca: "Nissan", parte_pago_modelo: "Versa", parte_pago_ano: "2020", parte_pago_km: "48.500", parte_pago_duenos: "2", parte_pago_deuda: "$3.200.000", cierra_at: iso(2 * DAY) },
    { ...poolBase, id: 9004, created_at: iso(-3 * HOUR), target_model: "MG4 Electric", region: "Biobío", comuna: "Concepción", cierra_at: iso(3 * DAY) },
    { ...poolBase, id: 9005, created_at: iso(-5 * HOUR), target_model: "Volvo EX30", region: "Metropolitana", comuna: "Vitacura", cierra_at: null },
    { ...poolBase, id: 9006, created_at: iso(-4 * DAY), target_model: "BYD Dolphin", region: "Metropolitana", comuna: "Maipú", cierra_at: iso(-2 * HOUR) },
  ];
}

/** Mis ofertas demo — variedad de estados y score. La of. al lead 9002 lo marca como "Ofertado". */
export function previewOfertas(): Oferta[] {
  const v = previewVendor.id;
  return [
    { id: "of-1", created_at: iso(-6 * HOUR), lead_id: 9002, vendor_id: v, precio_oferta: 21990000, horas_entrega: 48, version_match: "exacta", acepta_financiamiento: true, valor_regalias: 500000, precio_publicado: 23990000, marca_ofertada: "Tesla", modelo_ofertado: "Model 3", anio_ofertado: 2024, color_ofertado: "Blanco", estado: "ganadora", score_total: 92, descalificada: false, motivo_descalificacion: null, regalias_descripcion: "Bono de mantención por 1 año + set de accesorios", cercania_zona: "Misma comuna", score_desglose: { precio: 40, entrega: 22, cercania: 18, regalias: 12 }, enviada_cliente_at: iso(-5 * HOUR), respondida_at: iso(-3 * HOUR), aceptada_at: iso(-1 * HOUR) },
    { id: "of-2", created_at: iso(-1 * DAY), lead_id: 9101, vendor_id: v, precio_oferta: 18990000, horas_entrega: 72, version_match: "variacion_menor", acepta_financiamiento: false, valor_regalias: 0, precio_publicado: 19990000, marca_ofertada: "BYD", modelo_ofertado: "Dolphin", anio_ofertado: 2024, color_ofertado: null, estado: "evaluada", score_total: 74, descalificada: false, motivo_descalificacion: null },
    { id: "of-3", created_at: iso(-2 * DAY), lead_id: 9102, vendor_id: v, precio_oferta: 27990000, horas_entrega: 96, version_match: "upgrade", acepta_financiamiento: true, valor_regalias: 300000, precio_publicado: 28990000, marca_ofertada: "Kia", modelo_ofertado: "EV6 GT-Line", anio_ofertado: 2025, color_ofertado: "Gris", estado: "pendiente", score_total: null, descalificada: false, motivo_descalificacion: null },
    { id: "of-4", created_at: iso(-3 * DAY), lead_id: 9103, vendor_id: v, precio_oferta: 15990000, horas_entrega: 120, version_match: "inferior", acepta_financiamiento: false, valor_regalias: 0, precio_publicado: null, marca_ofertada: "MG", modelo_ofertado: "ZS EV", anio_ofertado: 2023, color_ofertado: null, estado: "perdida", score_total: 41, descalificada: true, motivo_descalificacion: "Entrega fuera del plazo (>96 h)" },
  ];
}

// ── Admin ────────────────────────────────────────────────────────────────────
export const previewAdminEmail = "francisco@electrificarte.cl";

export function previewAdminOverview(): AdminOverview {
  return { leadsOferta: 12, vendedoresTotal: 9, vendedoresActivos: 7, ofertas: 23 };
}

export function previewAdminLeads(): AdminLead[] {
  return [
    { id: 9001, created_at: iso(-2 * DAY), first_name: "Camila", last_name: "Rojas", email: "camila.rojas@example.com", telefono: "+56 9 8421 3390", target_model: "BYD Seal", region: "Metropolitana", comuna: "Providencia", financing: "Crédito automotriz", status: "pagado" },
    { id: 9002, created_at: iso(-1 * DAY), first_name: "Matías", last_name: "Fuentes", email: "matias.fuentes@example.com", telefono: "+56 9 7710 2245", target_model: "Tesla Model 3", region: "Metropolitana", comuna: "Las Condes", financing: "Contado", status: "pagado" },
    { id: 9003, created_at: iso(-1 * DAY), first_name: "Javiera", last_name: "Muñoz", email: "javiera.munoz@example.com", telefono: "+56 9 6634 8871", target_model: "Kia EV6", region: "Valparaíso", comuna: "Viña del Mar", financing: "Leasing", status: "pagado" },
    { id: 9004, created_at: iso(-3 * HOUR), first_name: "Ignacio", last_name: "Pérez", email: "ignacio.perez@example.com", telefono: "+56 9 5523 1198", target_model: "MG4 Electric", region: "Biobío", comuna: "Concepción", financing: "Contado", status: "pagado" },
  ];
}

export function previewAdminVendedores(): AdminVendedor[] {
  return [
    { id: "v1", nombre: "Marcelo", apellido: "Díaz", nombre_concesionario: "AutoMax Ñuñoa", email: "contacto@automaxnunoa.cl", telefono: "+56 9 1111 1111", region: "Metropolitana", comuna: "Ñuñoa", marcas: "BYD, Tesla, Kia", estado: "activo", ofertas: 11, ganadas: 5 },
    { id: "v2", nombre: "Paula", apellido: "Soto", nombre_concesionario: "Electro Motors Chile", email: "ventas@electromotors.cl", telefono: "+56 9 2222 2222", region: "Metropolitana", comuna: "Las Condes", marcas: "Tesla, Volvo", estado: "activo", ofertas: 9, ganadas: 3 },
    { id: "v3", nombre: "Rodrigo", apellido: "Vera", nombre_concesionario: "Motorpark Viña", email: "contacto@motorparkvina.cl", telefono: "+56 9 3333 3333", region: "Valparaíso", comuna: "Viña del Mar", marcas: "MG, GWM", estado: "activo", ofertas: 6, ganadas: 1 },
    { id: "v4", nombre: "Fernanda", apellido: "Lagos", nombre_concesionario: "Sur Eléctrico Concepción", email: "ventas@surelectrico.cl", telefono: "+56 9 4444 4444", region: "Biobío", comuna: "Concepción", marcas: "BYD, Hyundai", estado: "inactivo", ofertas: 3, ganadas: 0 },
  ];
}
