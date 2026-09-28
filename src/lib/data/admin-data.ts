import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminEmail } from "@/lib/auth/admin";

// El admin ve datos completos (incluida PII), por eso lee con service role.
// SIEMPRE detrás del gating de admin: cada función valida la sesión de admin y, si no la hay,
// devuelve vacío. Todo es SOLO LECTURA: este archivo no escribe en Supabase.

/** Tope de filas por tabla. Con los volúmenes actuales sobra; si se acerca, paginar en servidor. */
const LIMITE = 5000;

const DIA_MS = 86_400_000;

async function assertAdmin(): Promise<boolean> {
  return (await getAdminEmail()) !== null;
}

function logError(where: string, error: { message: string } | null) {
  if (error) console.error(`${where}:`, error.message);
}

/** ms → ISO para filtrar por fecha en Supabase. */
function iso(t: number): string {
  return new Date(t).toISOString();
}

/** Error de "la tabla o la columna todavía no existe" (migración sin aplicar). */
export function faltaEsquema(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return ["42P01", "42703", "PGRST204", "PGRST205"].includes(error.code ?? "") || /does not exist|could not find/i.test(error.message ?? "");
}

// ─── Waitlist ────────────────────────────────────────────────────────────────

export interface WaitlistRow {
  id: string;
  created_at: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  model: string | null;
  source: string | null;
  contacted: boolean | null;
  notes: string | null;
  /** true si es la inscripción más reciente de ese email (la tabla no deduplica). */
  ultima: boolean;
}

/** Inscripción en versión liviana (sin datos personales salvo el email, para deduplicar). */
export interface WaitlistLigera {
  id: string;
  created_at: string | null;
  email: string | null;
  contacted: boolean | null;
}

export interface WaitlistResult {
  /** Inscripciones desde `desde` (o todas), completas, más nuevas primero. */
  rows: WaitlistRow[];
  /** Todas las inscripciones en versión liviana: totales de hoy y "repetida". */
  todas: WaitlistLigera[];
}

/** Clave de persona: el email normalizado (la tabla no deduplica). */
export const clavePersona = (r: { email: string | null; id: string }) => (r.email ?? r.id).trim().toLowerCase();

/**
 * Waitlist. Las filas completas se leen solo desde `desde`; para saber si una inscripción es
 * la última de esa persona se mira la lista liviana completa (id, fecha, email).
 */
export async function getWaitlist(desde: number | null = null): Promise<WaitlistResult> {
  if (!(await assertAdmin())) return { rows: [], todas: [] };
  const db = createServiceClient();
  let q = db
    .from("waitlist")
    .select("id, created_at, first_name, last_name, full_name, email, phone, model, source, contacted, notes")
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  if (desde != null) q = q.gte("created_at", iso(desde));
  const [full, ligera] = await Promise.all([
    q,
    db.from("waitlist").select("id, created_at, email, contacted").order("created_at", { ascending: false }).limit(LIMITE),
  ]);
  logError("getWaitlist", full.error);
  logError("getWaitlist/ligera", ligera.error);
  const todas = (ligera.data ?? []) as WaitlistLigera[];
  const ultimas = new Set<string>();
  const vistos = new Set<string>();
  for (const r of todas) {
    const k = clavePersona(r);
    if (!vistos.has(k)) ultimas.add(r.id);
    vistos.add(k);
  }
  const rows = (full.data ?? []).map((r) => ({ ...r, ultima: ultimas.size ? ultimas.has(r.id) : true }) as WaitlistRow);
  return { rows, todas };
}

// ─── Asesorías $4.990 ────────────────────────────────────────────────────────

export type AsesoriaEstado = "activa" | "vencida" | "pendiente de pago" | "cancelada";

export interface AsesoriaRow {
  id: string;
  created_at: string | null;
  order_id: string | null;
  fullname: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  paid_at: string | null;
  /** Inicio de la vigencia: paid_at, o created_at si falta (misma regla que el bot). */
  inicio: string | null;
  vence: string | null;
  estado: AsesoriaEstado;
  dias_restantes: number;
}

/** Días de vigencia de la asesoría (ASESORIA_WINDOW_DAYS en la web; default 10). */
export const ASESORIA_DIAS = 10;

const CANCELADOS = ["cancelled", "canceled", "cancelado", "expired", "expirado", "inactive", "inactivo"];

/** Réplica de la vista asesorias_estado (scripts/sql/2026-09-24_asesorias_estado.sql en la web). */
export function calcularEstado(
  r: { status: string | null; paid_at: string | null; created_at: string | null },
  now: number,
): Pick<AsesoriaRow, "inicio" | "vence" | "estado" | "dias_restantes"> {
  const inicio = r.paid_at ?? r.created_at;
  const inicioMs = inicio ? new Date(inicio).getTime() : NaN;
  const venceMs = inicioMs + ASESORIA_DIAS * DIA_MS;
  const s = (r.status ?? "").trim().toLowerCase();
  let estado: AsesoriaEstado;
  if (s.startsWith("pendiente") || s.startsWith("pending")) estado = "pendiente de pago";
  else if (CANCELADOS.includes(s)) estado = "cancelada";
  else if (!isNaN(venceMs) && now < venceMs) estado = "activa";
  else estado = "vencida";
  const dias =
    estado === "activa" ? Math.max(0, ASESORIA_DIAS - Math.floor((now - inicioMs) / DIA_MS)) : 0;
  return {
    inicio,
    vence: isNaN(venceMs) ? null : new Date(venceMs).toISOString(),
    estado,
    dias_restantes: dias,
  };
}

export interface AsesoriasResult {
  rows: AsesoriaRow[];
  /** "vista" si respondió public.asesorias_estado; "calculado" si se aplicó la regla acá. */
  fuente: "vista" | "calculado";
}

/** Fecha del pago de una asesoría pagada (la misma regla del bot: paid_at o, si falta, created_at). */
export function fechaPago(r: Pick<AsesoriaRow, "estado" | "paid_at" | "created_at">): string | null {
  return r.estado === "activa" || r.estado === "vencida" ? (r.paid_at ?? r.created_at) : null;
}

/** Asesorías con formulario o pago desde `desde` (o todas). */
export async function getAsesorias(desde: number | null = null): Promise<AsesoriasResult> {
  if (!(await assertAdmin())) return { rows: [], fuente: "calculado" };
  const db = createServiceClient();
  const filtro = desde != null ? `created_at.gte.${iso(desde)},paid_at.gte.${iso(desde)}` : null;

  // 1) La vista, si está creada en Supabase.
  let qv = db
    .from("asesorias_estado")
    .select("id, created_at, order_id, fullname, email, phone, status, paid_at, inicio, vence, estado, dias_restantes")
    .limit(LIMITE);
  if (filtro) qv = qv.or(filtro);
  const vista = await qv;
  if (!vista.error && vista.data) {
    const rows = (vista.data as AsesoriaRow[]).sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
    );
    return { rows, fuente: "vista" };
  }

  // 2) Si no, la tabla y la misma regla calculada acá.
  let qt = db
    .from("advisory_payments")
    .select("id, created_at, order_id, fullname, email, phone, status, paid_at")
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  if (filtro) qt = qt.or(filtro);
  const { data, error } = await qt;
  logError("getAsesorias", error);
  const now = Date.now();
  return {
    rows: (data ?? []).map((r) => ({ ...r, ...calcularEstado(r, now) }) as AsesoriaRow),
    fuente: "calculado",
  };
}

// ─── Vendedores ──────────────────────────────────────────────────────────────

export interface VendedorRow {
  id: string;
  created_at: string | null;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  nombre_concesionario: string | null;
  comuna: string | null;
  region: string | null;
  marcas: string | null;
  estado: string | null;
  rut_vendors: string | null;
  financiamientos: string | null;
  ofertas: number;
  ganadas: number;
}

const GANADAS = ["ganadora", "aceptada"];

/** Vendedores registrados desde `desde` (o todos). */
export async function getVendedores(desde: number | null = null): Promise<VendedorRow[]> {
  if (!(await assertAdmin())) return [];
  const db = createServiceClient();
  let qv = db
    .from("leads_vendors")
    .select(
      "id, created_at, nombre, apellido, email, telefono, nombre_concesionario, comuna, region, marcas, estado, rut_vendors, financiamientos",
    )
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  if (desde != null) qv = qv.gte("created_at", iso(desde));
  const [{ data: vendedores, error: vErr }, { data: ofertas, error: oErr }] = await Promise.all([
    qv,
    db.from("ofertas").select("vendor_id, estado").limit(LIMITE),
  ]);
  logError("getVendedores", vErr);
  logError("getVendedores/ofertas", oErr);

  const porVendor = new Map<string, { ofertas: number; ganadas: number }>();
  for (const o of ofertas ?? []) {
    const v = o.vendor_id as string | null;
    if (!v) continue;
    const acc = porVendor.get(v) ?? { ofertas: 0, ganadas: 0 };
    acc.ofertas += 1;
    if (GANADAS.includes((o.estado as string) ?? "")) acc.ganadas += 1;
    porVendor.set(v, acc);
  }

  return (vendedores ?? []).map((v) => ({
    ...v,
    ofertas: porVendor.get(v.id)?.ofertas ?? 0,
    ganadas: porVendor.get(v.id)?.ganadas ?? 0,
  })) as VendedorRow[];
}

// ─── Leads de Oferta Exclusiva (en pausa) ───────────────────────────────────

export interface LeadRow {
  id: number;
  created_at: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  telefono: string | null;
  target_model: string | null;
  descripcion_interes: string | null;
  status: string | null;
  comuna: string | null;
  region: string | null;
  order_id: string | null;
  financing: string | null;
  origen: string | null;
  cierra_at: string | null;
  cerrada_at: string | null;
  parte_pago_marca: string | null;
  parte_pago_modelo: string | null;
  parte_pago_ano: string | null;
  parte_pago_km: string | null;
  parte_pago_duenos: string | null;
  parte_pago_deuda: string | null;
  parte_pago_mantenciones: string | null;
  parte_pago_patente: string | null;
  ofertas: number;
}

export async function getLeadsOferta(): Promise<LeadRow[]> {
  if (!(await assertAdmin())) return [];
  const db = createServiceClient();
  const [{ data, error }, { data: ofertas, error: oErr }] = await Promise.all([
    db
      .from("leads")
      .select(
        "id, created_at, first_name, last_name, email, telefono, target_model, descripcion_interes, status, comuna, region, order_id, financing, origen, cierra_at, cerrada_at, parte_pago_marca, parte_pago_modelo, parte_pago_ano, parte_pago_km, parte_pago_duenos, parte_pago_deuda, parte_pago_mantenciones, parte_pago_patente",
      )
      .order("created_at", { ascending: false })
      .limit(LIMITE),
    db.from("ofertas").select("lead_id").limit(LIMITE),
  ]);
  logError("getLeadsOferta", error);
  logError("getLeadsOferta/ofertas", oErr);
  const porLead = new Map<number, number>();
  for (const o of ofertas ?? []) porLead.set(o.lead_id as number, (porLead.get(o.lead_id as number) ?? 0) + 1);
  return (data ?? []).map((l) => ({ ...l, ofertas: porLead.get(l.id) ?? 0 })) as LeadRow[];
}

// ─── Newsletter y feedback del sitio ────────────────────────────────────────

export interface NewsletterRow {
  id: number;
  created_at: string | null;
  email: string | null;
}

/** Suscripciones desde `desde` (o todas). */
export async function getNewsletter(desde: number | null = null): Promise<NewsletterRow[]> {
  if (!(await assertAdmin())) return [];
  const db = createServiceClient();
  let q = db
    .from("newsletter")
    .select("id, created_at, email")
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  if (desde != null) q = q.gte("created_at", iso(desde));
  const { data, error } = await q;
  logError("getNewsletter", error);
  return (data ?? []) as NewsletterRow[];
}

export interface RatingRow {
  id: number;
  created_at: string | null;
  stars: number | null;
  feedback: string | null;
}

/** Calificaciones del sitio desde `desde` (o todas). */
export async function getRatings(desde: number | null = null): Promise<RatingRow[]> {
  if (!(await assertAdmin())) return [];
  const db = createServiceClient();
  let q = db
    .from("rating")
    .select("id, created_at, stars, feedback")
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  if (desde != null) q = q.gte("created_at", iso(desde));
  const { data, error } = await q;
  logError("getRatings", error);
  return (data ?? []).map((r) => ({ ...r, stars: r.stars == null ? null : Number(r.stars) })) as RatingRow[];
}

// ─── Waitlist de vendedores ─────────────────────────────────────────────────

export interface WaitlistVendedorRow {
  id: string;
  created_at: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  punto_venta: string | null;
  marcas: string | null;
  region: string | null;
  comuna: string | null;
  mensaje: string | null;
  source: string | null;
  contacted: boolean | null;
  notes: string | null;
}

export interface WaitlistVendedoresResult {
  rows: WaitlistVendedorRow[];
  /** false si la tabla todavía no existe en Supabase (migración del 27-sep sin aplicar). */
  disponible: boolean;
  /** Totales de hoy, sobre toda la tabla. */
  total: number;
  sinContactar: number;
}

/**
 * Vendedores que dejaron sus datos mientras la suscripción está en pausa (tabla
 * waitlist_vendedores, scripts/sql/2026-09-27_resenas_categorias_y_waitlist_vendedores.sql en
 * la web). Si la tabla no existe todavía, devuelve `disponible: false` en vez de fallar.
 */
export async function getWaitlistVendedores(desde: number | null = null): Promise<WaitlistVendedoresResult> {
  const vacio = { rows: [], disponible: false, total: 0, sinContactar: 0 };
  if (!(await assertAdmin())) return vacio;
  const db = createServiceClient();
  let q = db
    .from("waitlist_vendedores")
    .select("id, created_at, first_name, last_name, email, phone, punto_venta, marcas, region, comuna, mensaje, source, contacted, notes")
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  if (desde != null) q = q.gte("created_at", iso(desde));
  const [full, total, sin] = await Promise.all([
    q,
    db.from("waitlist_vendedores").select("id", { count: "exact", head: true }),
    db.from("waitlist_vendedores").select("id", { count: "exact", head: true }).or("contacted.is.null,contacted.eq.false"),
  ]);
  if (full.error) {
    if (!faltaEsquema(full.error)) logError("getWaitlistVendedores", full.error);
    return vacio;
  }
  return {
    rows: (full.data ?? []) as WaitlistVendedorRow[],
    disponible: true,
    total: total.count ?? full.data?.length ?? 0,
    sinContactar: sin.count ?? 0,
  };
}
