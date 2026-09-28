import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminEmail } from "@/lib/auth/admin";
import {
  clavePersona,
  fechaPago,
  getAsesorias,
  getNewsletter,
  getRatings,
  getVendedores,
  getWaitlist,
  getWaitlistVendedores,
} from "@/lib/data/admin-data";
import { CATEGORIAS, contarPorModerar, getAllReviews } from "@/lib/data/reviews-data";
import { consultaDesde, DIA_MS, enActual, infoPeriodo, resolverPeriodo, type PeriodoInfo } from "@/lib/periodo";
import {
  acumulado,
  cifraConteo,
  cifraPromedio,
  cifraTasa,
  construirTramos,
  contarPorTramo,
  primeraFecha,
  promedioPorTramo,
  type Cifra,
  type Tramo,
} from "@/lib/series";
import { slugATitulo } from "@/lib/utils";

// Datos del Resumen (vista BI). Lee solo lo necesario para el período elegido y su anterior,
// agrega en Node y devuelve un objeto serializable, SIN datos personales más allá del nombre
// que se muestra en la actividad reciente. Admin-only y solo lectura.

export type SerieId =
  | "waitlistPersonas"
  | "waitlistAcumulada"
  | "asesoriasFormularios"
  | "asesoriasPagadas"
  | "resenasRecibidas"
  | "resenasPublicadas"
  | "resenasNota"
  | "newsletter"
  | "feedbackCalificaciones"
  | "feedbackNota"
  | "vendedores"
  | "waitlistVendedores";

export type CifraId =
  | "waitlistPersonas"
  | "waitlistInscripciones"
  | "asesoriasFormularios"
  | "asesoriasPagadas"
  | "asesoriasConversion"
  | "resenasRecibidas"
  | "resenasPublicadas"
  | "resenasNota"
  | "newsletter"
  | "feedbackCalificaciones"
  | "feedbackNota"
  | "vendedores"
  | "waitlistVendedores"
  | "leadsOferta";

export interface Actividad {
  tipo: "waitlist" | "asesoria" | "vendedor" | "waitlistVendedor" | "oferta" | "resena" | "newsletter" | "feedback";
  titulo: string;
  detalle: string | null;
  fecha: string;
  href: string;
}

export interface CategoriaResumen {
  key: string;
  label: string;
  cifra: Cifra;
  serie: (number | null)[];
}

export interface FilaSeccion {
  nombre: string;
  href: string;
  cifra: Cifra;
  /** Estado de hoy que conviene atender ("3 sin contactar"). */
  pendiente?: string;
  nota?: string;
}

export interface ResumenData {
  periodo: PeriodoInfo;
  tramos: Tramo[];
  series: Record<SerieId, (number | null)[]>;
  cifras: Record<CifraId, Cifra>;
  categorias: CategoriaResumen[];
  /** true si alguna reseña del período trae notas por categoría. */
  hayCategorias: boolean;
  hoy: {
    waitlistPersonas: number;
    waitlistSinContactar: number;
    asesoriasActivas: number;
    resenasPorModerar: number;
    vendedoresActivos: number;
    waitlistVendedores: number;
    /** false si la tabla waitlist_vendedores todavía no existe. */
    waitlistVendedoresDisponible: boolean;
  };
  secciones: FilaSeccion[];
  actividad: Actividad[];
  generadoEn: number;
}

type SP = Record<string, string | string[] | undefined>;

const n = (v: number) => v.toLocaleString("es-CL");

export async function getResumen(sp: SP): Promise<ResumenData | null> {
  if (!(await getAdminEmail())) return null;
  const now = Date.now();
  const p0 = resolverPeriodo(sp, now);
  const desde = consultaDesde(p0);
  // Las asesorías activas hoy necesitan al menos los últimos 10 días, sea cual sea el período.
  const desdeAsesorias = desde == null ? null : Math.min(desde, now - 11 * DIA_MS);
  const iso = desde == null ? null : new Date(desde).toISOString();

  const db = createServiceClient();
  let qLeads = db.from("leads").select("created_at, first_name, last_name, target_model").order("created_at", { ascending: false }).limit(5000);
  if (iso) qLeads = qLeads.gte("created_at", iso);

  const [waitlist, asesorias, resenas, porModerar, newsletter, ratings, vendedores, wv, leads, activos] = await Promise.all([
    getWaitlist(desde),
    getAsesorias(desdeAsesorias),
    getAllReviews(desde),
    contarPorModerar(),
    getNewsletter(desde),
    getRatings(desde),
    getVendedores(desde),
    getWaitlistVendedores(desde),
    qLeads,
    db.from("leads_vendors").select("id", { count: "exact", head: true }).ilike("estado", "activo"),
  ]);
  if (leads.error) console.error("resumen/leads:", leads.error.message);
  if (activos.error) console.error("resumen/activos:", activos.error.message);
  const l = leads.data ?? [];

  // Primera inscripción de cada persona: es lo que cuenta como "persona nueva" en la waitlist.
  const primeras = new Map<string, string | null>();
  for (const r of [...waitlist.todas].reverse()) {
    const k = clavePersona(r);
    if (!primeras.has(k)) primeras.set(k, r.created_at);
  }
  const fechasPersonas = [...primeras.values()];

  const a = asesorias.rows;
  const pagos = a.map(fechaPago);
  const noRechazadas = resenas.filter((r) => r.status !== "rechazada");
  const publicadas = resenas.filter((r) => r.status === "aprobada").map((r) => r.moderated_at ?? r.created_at);

  // En "todo" la agrupación y el primer tramo dependen de cuándo empiezan los datos.
  const inicioDatos =
    p0.desde == null
      ? primeraFecha(
          fechasPersonas,
          a.map((x) => x.created_at),
          resenas.map((x) => x.created_at),
          newsletter.map((x) => x.created_at),
          ratings.map((x) => x.created_at),
          vendedores.map((x) => x.created_at),
          wv.rows.map((x) => x.created_at),
        )
      : null;
  const p = p0.desde == null ? resolverPeriodo(sp, now, inicioDatos) : p0;
  const tramos = construirTramos(p, inicioDatos);

  const personasAntes = p.desde == null ? 0 : fechasPersonas.filter((f) => f && Date.parse(f) < p.desde!).length;
  const serieWaitlist = contarPorTramo(fechasPersonas, tramos, p);

  const cifras: Record<CifraId, Cifra> = {
    waitlistPersonas: cifraConteo(fechasPersonas, p),
    waitlistInscripciones: cifraConteo(waitlist.rows.map((x) => x.created_at), p),
    asesoriasFormularios: cifraConteo(a.map((x) => x.created_at), p),
    asesoriasPagadas: cifraConteo(pagos, p),
    asesoriasConversion: { actual: null, anterior: null, formato: "pct", compara: false },
    resenasRecibidas: cifraConteo(resenas.map((x) => x.created_at), p),
    resenasPublicadas: cifraConteo(publicadas, p),
    resenasNota: cifraPromedio(noRechazadas.map((x) => ({ fecha: x.created_at, valor: x.rating })), p),
    newsletter: cifraConteo(newsletter.map((x) => x.created_at), p),
    feedbackCalificaciones: cifraConteo(ratings.map((x) => x.created_at), p),
    feedbackNota: cifraPromedio(ratings.map((x) => ({ fecha: x.created_at, valor: x.stars })), p),
    vendedores: cifraConteo(vendedores.map((x) => x.created_at), p),
    waitlistVendedores: cifraConteo(wv.rows.map((x) => x.created_at), p),
    leadsOferta: cifraConteo(l.map((x) => x.created_at), p),
  };
  // Conversión = pagadas / formularios del mismo período (aprox.: el pago puede caer en el período siguiente).
  cifras.asesoriasConversion = cifraTasa(cifras.asesoriasPagadas, cifras.asesoriasFormularios);

  const series: Record<SerieId, (number | null)[]> = {
    waitlistPersonas: serieWaitlist,
    waitlistAcumulada: acumulado(serieWaitlist, personasAntes),
    asesoriasFormularios: contarPorTramo(a.map((x) => x.created_at), tramos, p),
    asesoriasPagadas: contarPorTramo(pagos, tramos, p),
    resenasRecibidas: contarPorTramo(resenas.map((x) => x.created_at), tramos, p),
    resenasPublicadas: contarPorTramo(publicadas, tramos, p),
    resenasNota: promedioPorTramo(noRechazadas.map((x) => ({ fecha: x.created_at, valor: x.rating })), tramos, p),
    newsletter: contarPorTramo(newsletter.map((x) => x.created_at), tramos, p),
    feedbackCalificaciones: contarPorTramo(ratings.map((x) => x.created_at), tramos, p),
    feedbackNota: promedioPorTramo(ratings.map((x) => ({ fecha: x.created_at, valor: x.stars })), tramos, p),
    vendedores: contarPorTramo(vendedores.map((x) => x.created_at), tramos, p),
    waitlistVendedores: contarPorTramo(wv.rows.map((x) => x.created_at), tramos, p),
  };

  const categorias: CategoriaResumen[] = CATEGORIAS.map((c) => {
    const items = noRechazadas.map((x) => ({ fecha: x.created_at, valor: x[c.key] }));
    return { key: c.key, label: c.label, cifra: cifraPromedio(items, p), serie: promedioPorTramo(items, tramos, p) };
  });
  const hayCategorias = noRechazadas.some((x) => enActual(x.created_at, p) && CATEGORIAS.some((c) => x[c.key] != null));

  const personasHoy = primeras.size;
  const sinContactar = new Set(waitlist.todas.filter((x) => !x.contacted).map(clavePersona)).size;
  const activasHoy = a.filter((x) => x.estado === "activa").length;
  const pendientesPago = a.filter((x) => x.estado === "pendiente de pago" && enActual(x.created_at, p)).length;

  const secciones: FilaSeccion[] = [
    { nombre: "Waitlist", href: "/admin/waitlist", cifra: cifras.waitlistPersonas, pendiente: sinContactar ? `${n(sinContactar)} sin contactar hoy` : undefined },
    { nombre: "Asesorías pagadas", href: "/admin/asesorias", cifra: cifras.asesoriasPagadas, pendiente: pendientesPago ? `${n(pendientesPago)} con pago pendiente` : undefined },
    { nombre: "Reseñas", href: "/admin/resenas", cifra: cifras.resenasRecibidas, pendiente: porModerar ? `${n(porModerar)} por moderar hoy` : undefined },
    { nombre: "Newsletter", href: "/admin/newsletter", cifra: cifras.newsletter },
    { nombre: "Feedback del sitio", href: "/admin/feedback", cifra: cifras.feedbackCalificaciones },
    { nombre: "Vendedores", href: "/admin/vendedores", cifra: cifras.vendedores },
    ...(wv.disponible
      ? [{ nombre: "Waitlist de vendedores", href: "/admin/waitlist-vendedores", cifra: cifras.waitlistVendedores, pendiente: wv.sinContactar ? `${n(wv.sinContactar)} sin contactar hoy` : undefined }]
      : []),
    { nombre: "Leads Oferta", href: "/admin/leads-oferta", cifra: cifras.leadsOferta, nota: "En pausa" },
  ];

  // ── Actividad reciente, solo del período ──
  type Cruda = Omit<Actividad, "fecha"> & { fecha: string | null };
  const crudas: Cruda[] = [
    ...waitlist.rows.map((x) => ({
      tipo: "waitlist" as const,
      titulo: x.full_name || [x.first_name, x.last_name].filter(Boolean).join(" ") || x.email || "Persona sin nombre",
      detalle: x.model ? `Se sumó a la waitlist, le interesa ${x.model}` : "Se sumó a la waitlist",
      fecha: x.created_at,
      href: "/admin/waitlist",
    })),
    ...a.map((x) => ({
      tipo: "asesoria" as const,
      titulo: x.fullname || x.email || "Persona sin nombre",
      detalle: x.estado === "pendiente de pago" ? "Llenó el formulario de la asesoría, pago pendiente" : "Contrató la asesoría",
      fecha: fechaPago(x) ?? x.created_at,
      href: "/admin/asesorias",
    })),
    ...vendedores.map((x) => ({
      tipo: "vendedor" as const,
      titulo: [x.nombre, x.apellido].filter(Boolean).join(" ") || x.nombre_concesionario || "Vendedor sin nombre",
      detalle: "Se registró como vendedor oficial",
      fecha: x.created_at,
      href: "/admin/vendedores",
    })),
    ...wv.rows.map((x) => ({
      tipo: "waitlistVendedor" as const,
      titulo: [x.first_name, x.last_name].filter(Boolean).join(" ") || x.punto_venta || "Vendedor sin nombre",
      detalle: `Se sumó a la waitlist de vendedores${x.marcas ? `, vende ${x.marcas}` : ""}`,
      fecha: x.created_at,
      href: "/admin/waitlist-vendedores",
    })),
    ...l.map((x) => ({
      tipo: "oferta" as const,
      titulo: [x.first_name, x.last_name].filter(Boolean).join(" ") || "Persona sin nombre",
      detalle: x.target_model ? `Lead de Oferta Exclusiva por ${slugATitulo(x.target_model)}` : "Lead de Oferta Exclusiva",
      fecha: x.created_at,
      href: "/admin/leads-oferta",
    })),
    ...resenas.map((x) => ({
      tipo: "resena" as const,
      titulo: x.first_name || "Persona sin nombre",
      detalle: `Dejó una reseña${x.car_model ? ` de ${[x.car_brand, x.car_model].filter(Boolean).join(" ")}` : ""}${x.rating ? ` con ${x.rating.toLocaleString("es-CL")} de 5` : ""}`,
      fecha: x.created_at,
      href: "/admin/resenas",
    })),
    ...newsletter.map((x) => ({
      tipo: "newsletter" as const,
      titulo: "Nueva suscripción al newsletter",
      detalle: null,
      fecha: x.created_at,
      href: "/admin/newsletter",
    })),
    ...ratings.map((x) => ({
      tipo: "feedback" as const,
      titulo: `Calificó el sitio con ${Number(x.stars).toLocaleString("es-CL")} de 5`,
      detalle: x.feedback || null,
      fecha: x.created_at,
      href: "/admin/feedback",
    })),
  ];
  const actividad = crudas
    .filter((x): x is Actividad => !!x.fecha && enActual(x.fecha, p))
    .sort((x, y) => Date.parse(y.fecha) - Date.parse(x.fecha))
    .slice(0, 8);

  return {
    periodo: infoPeriodo(p),
    tramos,
    series,
    cifras,
    categorias,
    hayCategorias,
    hoy: {
      waitlistPersonas: personasHoy,
      waitlistSinContactar: sinContactar,
      asesoriasActivas: activasHoy,
      resenasPorModerar: porModerar,
      vendedoresActivos: activos.count ?? 0,
      waitlistVendedores: wv.total,
      waitlistVendedoresDisponible: wv.disponible,
    },
    secciones,
    actividad,
    generadoEn: now,
  };
}
