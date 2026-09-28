// Período elegido en el panel admin (Resumen y secciones). Vive en la URL para poder compartir
// la vista: ?periodo=7d|30d|90d|12m|todo, o ?desde=AAAA-MM-DD&hasta=AAAA-MM-DD (rango
// personalizado, ambos inclusive), más ?agrupar=dia|semana|mes (si falta, se elige solo).
//
// Todo se calcula en hora de Chile: un "día" es un día calendario en America/Santiago, igual
// que las fechas que se muestran en las tablas. Módulo puro (servidor y cliente).

export type PeriodoKey = "7d" | "30d" | "90d" | "12m" | "todo" | "rango";
export type Agrupacion = "dia" | "semana" | "mes";

export const PERIODO_DEFAULT: PeriodoKey = "30d";

export const PRESETS: { key: Exclude<PeriodoKey, "rango">; label: string; corto: string }[] = [
  { key: "7d", label: "Últimos 7 días", corto: "7 días" },
  { key: "30d", label: "Últimos 30 días", corto: "30 días" },
  { key: "90d", label: "Últimos 90 días", corto: "90 días" },
  { key: "12m", label: "Últimos 12 meses", corto: "12 meses" },
  { key: "todo", label: "Todo el historial", corto: "Todo" },
];

export const AGRUPACIONES: { key: Agrupacion; label: string; porLabel: string }[] = [
  { key: "dia", label: "Por día", porLabel: "por día" },
  { key: "semana", label: "Por semana", porLabel: "por semana" },
  { key: "mes", label: "Por mes", porLabel: "por mes" },
];

/** Parámetros de URL que definen el período (el resto de la query no se toca). */
export const PARAMS_PERIODO = ["periodo", "desde", "hasta", "agrupar"] as const;

export const DIA_MS = 86_400_000;
const TZ = "America/Santiago";

/** Lo que el cliente necesita del período (serializable). */
export interface PeriodoInfo {
  key: PeriodoKey;
  agrupar: Agrupacion;
  /** true si `agrupar` lo eligió el panel según el largo del período. */
  agruparAuto: boolean;
  /** Primer y último día del período en hora de Chile (AAAA-MM-DD). null en "todo". */
  desdeYmd: string | null;
  hastaYmd: string;
  /** "Últimos 30 días", "1 sept. 2026 al 15 sept. 2026", "Todo el historial". */
  etiqueta: string;
  /** "vs. los 30 días anteriores". null si no hay con qué comparar ("todo"). */
  comparacion: string | null;
}

export interface Periodo extends PeriodoInfo {
  /** Inicio (incluido), en ms. null = sin límite ("todo"). */
  desde: number | null;
  /** Fin (excluido), en ms. */
  hasta: number;
  /** Período anterior de igual duración, para las variaciones. null en "todo". */
  anterior: { desde: number; hasta: number } | null;
}

// ─── Fechas en hora de Chile ────────────────────────────────────────────────

const PARTES = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partes(t: number) {
  const p: Record<string, number> = {};
  for (const x of PARTES.formatToParts(new Date(t))) if (x.type !== "literal") p[x.type] = Number(x.value);
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Diferencia hora de Chile − UTC en ese instante (ms). */
function offset(t: number): number {
  const p = partes(t);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - (t - (t % 1000));
}

/** "2026-09-27" (día calendario en Chile) de un instante. */
export function ymdChile(t: number): string {
  const p = partes(t);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

export function esYmd(v: string | null | undefined): v is string {
  const m = v ? YMD.exec(v) : null;
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Instante en que empieza ese día en Chile. */
export function inicioDiaChile(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  // Dos pasadas: la primera estima el offset, la segunda lo corrige si cae en un cambio de hora.
  const t1 = utc - offset(utc);
  return utc - offset(t1);
}

/** Suma días a un AAAA-MM-DD (aritmética de calendario, sin husos). */
export function sumarDias(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Lunes de la semana de ese día (semanas de lunes a domingo). */
export function lunesDe(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = domingo
  return sumarDias(ymd, -((dow + 6) % 7));
}

function diasEntre(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DIA_MS);
}

const FMT_DIA = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "2026-09-01" → "1 sept. 2026". */
export function ymdLargo(ymd: string): string {
  return FMT_DIA.format(new Date(`${ymd}T12:00:00Z`));
}

// ─── Resolver el período desde la URL ───────────────────────────────────────

type SP = Record<string, string | string[] | undefined>;

function uno(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Agrupación automática según el largo en días. */
export function agrupacionAuto(dias: number): Agrupacion {
  if (dias <= 45) return "dia";
  if (dias <= 200) return "semana";
  return "mes";
}

/**
 * Lee el período de la URL. Si viene algo inválido cae al default (30 días), nunca revienta.
 * `inicioDatos` (ms) se usa solo en "todo" para elegir la agrupación automática.
 */
export function resolverPeriodo(sp: SP, now: number = Date.now(), inicioDatos?: number | null): Periodo {
  const hoy = ymdChile(now);
  let key = (uno(sp.periodo) ?? "") as PeriodoKey;
  let desdeYmd: string | null;
  let hastaYmd = hoy;

  const d = uno(sp.desde);
  const h = uno(sp.hasta);
  if (esYmd(d) || esYmd(h)) {
    key = "rango";
    let a = esYmd(d) ? d : hoy;
    let b = esYmd(h) ? h : hoy;
    if (a > b) [a, b] = [b, a];
    if (b > hoy) b = hoy;
    if (a > hoy) a = hoy;
    desdeYmd = a;
    hastaYmd = b;
  } else {
    if (!PRESETS.some((p) => p.key === key)) key = PERIODO_DEFAULT;
    switch (key) {
      case "7d":
        desdeYmd = sumarDias(hoy, -6);
        break;
      case "90d":
        desdeYmd = sumarDias(hoy, -89);
        break;
      case "12m": {
        // Doce meses calendario completos contando el actual: así la agrupación mensual no
        // parte con un mes a medias.
        const [y, m] = hoy.split("-").map(Number);
        desdeYmd = new Date(Date.UTC(y, m - 1 - 11, 1)).toISOString().slice(0, 10);
        break;
      }
      case "todo":
        desdeYmd = null;
        break;
      default:
        desdeYmd = sumarDias(hoy, -29);
    }
  }

  const desde = desdeYmd ? inicioDiaChile(desdeYmd) : null;
  // El fin es el cierre del último día, salvo hoy: ahí es "ahora".
  const hasta = hastaYmd === hoy ? now : inicioDiaChile(sumarDias(hastaYmd, 1));

  const inicioSerie = desdeYmd ?? (inicioDatos ? ymdChile(inicioDatos) : sumarDias(hoy, -29));
  const dias = diasEntre(inicioSerie, hastaYmd) + 1;

  const pedida = uno(sp.agrupar) as Agrupacion | undefined;
  const agruparAuto = !AGRUPACIONES.some((a) => a.key === pedida);
  const agrupar = agruparAuto ? agrupacionAuto(dias) : pedida!;

  let anterior: Periodo["anterior"] = null;
  let comparacion: string | null = null;
  if (desde != null) {
    // Mismo largo en días calendario, justo antes del inicio. Si el período termina hoy (a
    // medias), el anterior se corta en la misma hora para comparar peras con peras.
    const ini = inicioDiaChile(sumarDias(desdeYmd!, -dias));
    anterior = { desde: ini, hasta: Math.min(desde, ini + (hasta - desde)) };
    const preset = PRESETS.find((p) => p.key === key);
    comparacion =
      key === "12m"
        ? "vs. los 12 meses anteriores"
        : preset
          ? `vs. los ${preset.corto} anteriores`
          : `vs. los ${dias} ${dias === 1 ? "día anterior" : "días anteriores"}`;
  }

  const etiqueta =
    key === "rango"
      ? desdeYmd === hastaYmd
        ? ymdLargo(desdeYmd!)
        : `${ymdLargo(desdeYmd!)} al ${ymdLargo(hastaYmd)}`
      : PRESETS.find((p) => p.key === key)!.label;

  return { key, agrupar, agruparAuto, desdeYmd, hastaYmd, etiqueta, comparacion, desde, hasta, anterior };
}

/** Solo lo serializable, para pasar a componentes cliente. */
export function infoPeriodo(p: Periodo): PeriodoInfo {
  const { key, agrupar, agruparAuto, desdeYmd, hastaYmd, etiqueta, comparacion } = p;
  return { key, agrupar, agruparAuto, desdeYmd, hastaYmd, etiqueta, comparacion };
}

/** Desde dónde hay que leer para cubrir el período y su anterior. null = sin límite. */
export function consultaDesde(p: Periodo): number | null {
  return p.anterior?.desde ?? p.desde;
}

/** Copia los parámetros de período de una query a un href (para no perderlo al navegar). */
export function conPeriodo(href: string, sp: URLSearchParams | null | undefined): string {
  if (!sp) return href;
  const q = new URLSearchParams();
  for (const k of PARAMS_PERIODO) {
    const v = sp.get(k);
    if (v) q.set(k, v);
  }
  const s = q.toString();
  return s ? `${href}${href.includes("?") ? "&" : "?"}${s}` : href;
}

// ─── Clasificar fechas ───────────────────────────────────────────────────────

export function ms(fecha: string | null | undefined): number | null {
  if (!fecha) return null;
  const t = Date.parse(fecha);
  return isNaN(t) ? null : t;
}

export function enActual(fecha: string | null | undefined, p: Periodo): boolean {
  const t = ms(fecha);
  return t != null && (p.desde == null || t >= p.desde) && t < p.hasta;
}

export function enAnterior(fecha: string | null | undefined, p: Periodo): boolean {
  const t = ms(fecha);
  return t != null && !!p.anterior && t >= p.anterior.desde && t < p.anterior.hasta;
}
