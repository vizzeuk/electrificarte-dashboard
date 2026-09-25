import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminEmail } from "@/lib/auth/admin";
import { slugATitulo } from "@/lib/utils";

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

export async function getWaitlist(): Promise<WaitlistRow[]> {
  if (!(await assertAdmin())) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("waitlist")
    .select("id, created_at, first_name, last_name, full_name, email, phone, model, source, contacted, notes")
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  logError("getWaitlist", error);
  const vistos = new Set<string>();
  return (data ?? []).map((r) => {
    const key = (r.email ?? r.id).trim().toLowerCase();
    const ultima = !vistos.has(key);
    vistos.add(key);
    return { ...r, ultima } as WaitlistRow;
  });
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
function calcularEstado(
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

export async function getAsesorias(): Promise<AsesoriasResult> {
  if (!(await assertAdmin())) return { rows: [], fuente: "calculado" };
  const db = createServiceClient();

  // 1) La vista, si está creada en Supabase.
  const vista = await db
    .from("asesorias_estado")
    .select("id, created_at, order_id, fullname, email, phone, status, paid_at, inicio, vence, estado, dias_restantes")
    .limit(LIMITE);
  if (!vista.error && vista.data) {
    const rows = (vista.data as AsesoriaRow[]).sort(
      (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
    );
    return { rows, fuente: "vista" };
  }

  // 2) Si no, la tabla y la misma regla calculada acá.
  const { data, error } = await db
    .from("advisory_payments")
    .select("id, created_at, order_id, fullname, email, phone, status, paid_at")
    .order("created_at", { ascending: false })
    .limit(LIMITE);
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

export async function getVendedores(): Promise<VendedorRow[]> {
  if (!(await assertAdmin())) return [];
  const db = createServiceClient();
  const [{ data: vendedores, error: vErr }, { data: ofertas, error: oErr }] = await Promise.all([
    db
      .from("leads_vendors")
      .select(
        "id, created_at, nombre, apellido, email, telefono, nombre_concesionario, comuna, region, marcas, estado, rut_vendors, financiamientos",
      )
      .order("created_at", { ascending: false })
      .limit(LIMITE),
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

export async function getNewsletter(): Promise<NewsletterRow[]> {
  if (!(await assertAdmin())) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("newsletter")
    .select("id, created_at, email")
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  logError("getNewsletter", error);
  return (data ?? []) as NewsletterRow[];
}

export interface RatingRow {
  id: number;
  created_at: string | null;
  stars: number | null;
  feedback: string | null;
}

export async function getRatings(): Promise<RatingRow[]> {
  if (!(await assertAdmin())) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("rating")
    .select("id, created_at, stars, feedback")
    .order("created_at", { ascending: false })
    .limit(LIMITE);
  logError("getRatings", error);
  return (data ?? []).map((r) => ({ ...r, stars: r.stars == null ? null : Number(r.stars) })) as RatingRow[];
}

// ─── Resumen ────────────────────────────────────────────────────────────────

export interface Conteo {
  total: number;
  ultimos7: number;
  ultimos30: number;
}

export interface Actividad {
  tipo: "waitlist" | "asesoria" | "vendedor" | "oferta" | "resena" | "newsletter" | "feedback";
  titulo: string;
  detalle: string | null;
  fecha: string;
  href: string;
}

export interface AdminOverview {
  waitlist: Conteo & { personas: number; sinContactar: number };
  asesorias: Conteo & { pagadas: number; activas: number; pendientes: number };
  vendedores: Conteo & { activos: number };
  leadsOferta: Conteo & { pagados: number };
  resenas: Conteo & { porModerar: number; publicadas: number };
  newsletter: Conteo;
  feedback: Conteo & { promedio: number | null };
  actividad: Actividad[];
  generadoEn: number;
}

function contar(fechas: (string | null)[], now: number): Conteo {
  let u7 = 0;
  let u30 = 0;
  for (const f of fechas) {
    if (!f) continue;
    const t = now - new Date(f).getTime();
    if (t <= 7 * DIA_MS) u7++;
    if (t <= 30 * DIA_MS) u30++;
  }
  return { total: fechas.length, ultimos7: u7, ultimos30: u30 };
}

export async function getAdminOverview(): Promise<AdminOverview | null> {
  if (!(await assertAdmin())) return null;
  const db = createServiceClient();
  const now = Date.now();

  const [waitlist, asesorias, vendedores, leads, reviews, newsletter, rating] = await Promise.all([
    db.from("waitlist").select("created_at, first_name, last_name, full_name, email, model, source, contacted").order("created_at", { ascending: false }).limit(LIMITE),
    getAsesorias(),
    db.from("leads_vendors").select("created_at, nombre, apellido, nombre_concesionario, estado, region").order("created_at", { ascending: false }).limit(LIMITE),
    db.from("leads").select("created_at, first_name, last_name, target_model, status").order("created_at", { ascending: false }).limit(LIMITE),
    db.from("reviews").select("created_at, first_name, car_brand, car_model, rating, status").order("created_at", { ascending: false }).limit(LIMITE),
    db.from("newsletter").select("created_at").order("created_at", { ascending: false }).limit(LIMITE),
    db.from("rating").select("created_at, stars, feedback").order("created_at", { ascending: false }).limit(LIMITE),
  ]);
  logError("overview/waitlist", waitlist.error);
  logError("overview/vendedores", vendedores.error);
  logError("overview/leads", leads.error);
  logError("overview/reviews", reviews.error);
  logError("overview/newsletter", newsletter.error);
  logError("overview/rating", rating.error);

  const w = waitlist.data ?? [];
  const a = asesorias.rows;
  const v = vendedores.data ?? [];
  const l = leads.data ?? [];
  const r = reviews.data ?? [];
  const n = newsletter.data ?? [];
  const rt = rating.data ?? [];

  const estrellas = rt.map((x) => Number(x.stars)).filter((x) => !isNaN(x) && x > 0);

  type ActividadCruda = Omit<Actividad, "fecha"> & { fecha: string | null };
  const crudas: ActividadCruda[] = [
    ...w.slice(0, 10).map((x) => ({
      tipo: "waitlist" as const,
      titulo: x.full_name || [x.first_name, x.last_name].filter(Boolean).join(" ") || x.email || "Persona sin nombre",
      detalle: x.model ? `Se sumó a la waitlist, le interesa ${x.model}` : "Se sumó a la waitlist",
      fecha: x.created_at,
      href: "/admin/waitlist",
    })),
    ...a.slice(0, 10).map((x) => ({
      tipo: "asesoria" as const,
      titulo: x.fullname || x.email || "Persona sin nombre",
      detalle: x.estado === "pendiente de pago" ? "Llenó el formulario de la asesoría, pago pendiente" : "Contrató la asesoría",
      fecha: x.paid_at ?? x.created_at,
      href: "/admin/asesorias",
    })),
    ...v.slice(0, 10).map((x) => ({
      tipo: "vendedor" as const,
      titulo: [x.nombre, x.apellido].filter(Boolean).join(" ") || x.nombre_concesionario || "Vendedor sin nombre",
      detalle: "Se registró como vendedor oficial",
      fecha: x.created_at,
      href: "/admin/vendedores",
    })),
    ...l.slice(0, 10).map((x) => ({
      tipo: "oferta" as const,
      titulo: [x.first_name, x.last_name].filter(Boolean).join(" ") || "Persona sin nombre",
      detalle: x.target_model ? `Lead de Oferta Exclusiva por ${slugATitulo(x.target_model)}` : "Lead de Oferta Exclusiva",
      fecha: x.created_at,
      href: "/admin/leads-oferta",
    })),
    ...r.slice(0, 10).map((x) => ({
      tipo: "resena" as const,
      titulo: x.first_name || "Persona sin nombre",
      detalle: `Dejó una reseña${x.car_model ? ` de ${[x.car_brand, x.car_model].filter(Boolean).join(" ")}` : ""}${x.rating ? ` con ${x.rating} de 5` : ""}`,
      fecha: x.created_at,
      href: "/admin/resenas",
    })),
    ...n.slice(0, 5).map((x) => ({
      tipo: "newsletter" as const,
      titulo: "Nueva suscripción al newsletter",
      detalle: null,
      fecha: x.created_at,
      href: "/admin/newsletter",
    })),
    ...rt.slice(0, 5).map((x) => ({
      tipo: "feedback" as const,
      titulo: `Calificó el sitio con ${Number(x.stars).toLocaleString("es-CL")} de 5`,
      detalle: x.feedback || null,
      fecha: x.created_at,
      href: "/admin/feedback",
    })),
  ];
  const actividad = crudas
    .filter((x): x is Actividad => !!x.fecha)
    .sort((x, y) => new Date(y.fecha).getTime() - new Date(x.fecha).getTime())
    .slice(0, 12);

  const personas = new Set(w.map((x) => (x.email ?? "").trim().toLowerCase()).filter(Boolean)).size;

  return {
    waitlist: {
      ...contar(w.map((x) => x.created_at), now),
      personas,
      sinContactar: w.filter((x) => !x.contacted).length,
    },
    asesorias: {
      ...contar(a.map((x) => x.created_at), now),
      pagadas: a.filter((x) => x.estado === "activa" || x.estado === "vencida").length,
      activas: a.filter((x) => x.estado === "activa").length,
      pendientes: a.filter((x) => x.estado === "pendiente de pago").length,
    },
    vendedores: {
      ...contar(v.map((x) => x.created_at), now),
      activos: v.filter((x) => (x.estado ?? "").toLowerCase() === "activo").length,
    },
    leadsOferta: {
      ...contar(l.map((x) => x.created_at), now),
      pagados: l.filter((x) => (x.status ?? "").toLowerCase() === "pagado").length,
    },
    resenas: {
      ...contar(r.map((x) => x.created_at), now),
      porModerar: r.filter((x) => x.status === "pendiente").length,
      publicadas: r.filter((x) => x.status === "aprobada").length,
    },
    newsletter: contar(n.map((x) => x.created_at), now),
    feedback: {
      ...contar(rt.map((x) => x.created_at), now),
      promedio: estrellas.length ? estrellas.reduce((s, x) => s + x, 0) / estrellas.length : null,
    },
    actividad,
    generadoEn: now,
  };
}
