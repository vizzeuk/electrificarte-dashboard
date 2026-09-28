// Series de tiempo y comparaciones para el panel admin. Puro (servidor y cliente): recibe
// fechas/valores ya leídos y los agrupa en los tramos (día, semana o mes) del período.

import {
  enActual,
  enAnterior,
  lunesDe,
  ms,
  resolverPeriodo,
  sumarDias,
  ymdChile,
  type Agrupacion,
  type Periodo,
} from "@/lib/periodo";

export interface Tramo {
  key: string;
  /** Etiqueta corta para el eje: "27 sept.", "sem. 22 sept.", "sept. 26". */
  label: string;
  /** Etiqueta completa para el tooltip: "Semana del 22 sept. 2026". */
  largo: string;
}

const FMT_CORTO = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", timeZone: "UTC" });
const FMT_LARGO = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const FMT_MES = new Intl.DateTimeFormat("es-CL", { month: "short", year: "2-digit", timeZone: "UTC" });
const FMT_MES_LARGO = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "UTC" });

const d12 = (ymd: string) => new Date(`${ymd}T12:00:00Z`);

/** Clave del tramo al que pertenece un instante. */
export function claveTramo(t: number, agr: Agrupacion): string {
  const ymd = ymdChile(t);
  if (agr === "dia") return ymd;
  if (agr === "semana") return lunesDe(ymd);
  return ymd.slice(0, 7);
}

/**
 * Tramos del período, del más antiguo al más nuevo. En "todo" arranca en el primer registro
 * (`inicioDatos`); si no hay datos, en los últimos 30 días.
 */
export function construirTramos(p: Periodo, inicioDatos: number | null): Tramo[] {
  const primero = p.desdeYmd ?? (inicioDatos != null ? ymdChile(inicioDatos) : sumarDias(p.hastaYmd, -29));
  const out: Tramo[] = [];
  if (p.agrupar === "dia") {
    for (let d = primero; d <= p.hastaYmd && out.length < 800; d = sumarDias(d, 1)) {
      out.push({ key: d, label: FMT_CORTO.format(d12(d)), largo: FMT_LARGO.format(d12(d)) });
    }
  } else if (p.agrupar === "semana") {
    for (let d = lunesDe(primero); d <= p.hastaYmd && out.length < 400; d = sumarDias(d, 7)) {
      out.push({ key: d, label: FMT_CORTO.format(d12(d)), largo: `Semana del ${FMT_LARGO.format(d12(d))}` });
    }
  } else {
    let [y, m] = primero.split("-").map(Number);
    const fin = p.hastaYmd.slice(0, 7);
    while (out.length < 240) {
      const key = `${y}-${String(m).padStart(2, "0")}`;
      if (key > fin) break;
      const ref = d12(`${key}-01`);
      const largo = FMT_MES_LARGO.format(ref);
      out.push({ key, label: FMT_MES.format(ref), largo: largo.charAt(0).toLocaleUpperCase("es-CL") + largo.slice(1) });
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
  }
  return out;
}

function indice(tramos: Tramo[]): Map<string, number> {
  return new Map(tramos.map((t, i) => [t.key, i]));
}

/** Cuántas fechas caen en cada tramo (solo las del período actual). */
export function contarPorTramo(fechas: (string | null | undefined)[], tramos: Tramo[], p: Periodo): number[] {
  const idx = indice(tramos);
  const out = tramos.map(() => 0);
  for (const f of fechas) {
    if (!enActual(f, p)) continue;
    const i = idx.get(claveTramo(ms(f)!, p.agrupar));
    if (i != null) out[i] += 1;
  }
  return out;
}

/** Promedio de `valor` en cada tramo; null donde no hay datos (el gráfico deja el hueco). */
export function promedioPorTramo(
  items: { fecha: string | null | undefined; valor: number | null | undefined }[],
  tramos: Tramo[],
  p: Periodo,
): (number | null)[] {
  const idx = indice(tramos);
  const suma = tramos.map(() => 0);
  const n = tramos.map(() => 0);
  for (const it of items) {
    if (it.valor == null || isNaN(it.valor) || !enActual(it.fecha, p)) continue;
    const i = idx.get(claveTramo(ms(it.fecha)!, p.agrupar));
    if (i == null) continue;
    suma[i] += it.valor;
    n[i] += 1;
  }
  return suma.map((s, i) => (n[i] ? Math.round((s / n[i]) * 10) / 10 : null));
}

/** Suma acumulada partiendo de `base` (lo que había antes del período). */
export function acumulado(serie: number[], base: number): number[] {
  let acc = base;
  return serie.map((v) => (acc += v));
}

// ─── Cifras con comparación ─────────────────────────────────────────────────

export type Formato = "numero" | "nota" | "pct";

export interface Cifra {
  actual: number | null;
  /** Valor del período anterior; null si no hay comparación ("todo") o no hay datos. */
  anterior: number | null;
  formato: Formato;
  /** false cuando el período es "todo" (no hay contra qué comparar). */
  compara: boolean;
}

/** Conteo en el período actual y en el anterior. */
export function cifraConteo(fechas: (string | null | undefined)[], p: Periodo): Cifra {
  let a = 0;
  let b = 0;
  for (const f of fechas) {
    if (enActual(f, p)) a++;
    else if (enAnterior(f, p)) b++;
  }
  return { actual: a, anterior: p.anterior ? b : null, formato: "numero", compara: !!p.anterior };
}

function prom(xs: number[]): number | null {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null;
}

/** Promedio de una nota (1 a 5) en el período actual y en el anterior. */
export function cifraPromedio(
  items: { fecha: string | null | undefined; valor: number | null | undefined }[],
  p: Periodo,
): Cifra {
  const a: number[] = [];
  const b: number[] = [];
  for (const it of items) {
    if (it.valor == null || isNaN(it.valor) || it.valor <= 0) continue;
    if (enActual(it.fecha, p)) a.push(it.valor);
    else if (enAnterior(it.fecha, p)) b.push(it.valor);
  }
  return { actual: prom(a), anterior: p.anterior ? prom(b) : null, formato: "nota", compara: !!p.anterior };
}

/** Tasa (0 a 100) = parte / total, en ambos períodos. */
export function cifraTasa(parte: Cifra, total: Cifra): Cifra {
  const t = (x: number | null, y: number | null) => (x != null && y ? (x / y) * 100 : null);
  return { actual: t(parte.actual, total.actual), anterior: t(parte.anterior, total.anterior), formato: "pct", compara: parte.compara };
}

export interface Variacion {
  /** "12%", "0,3", "5 pp", "Nuevo". */
  texto: string;
  signo: 1 | 0 | -1;
  /** Texto accesible completo. */
  aria: string;
}

const NUM1 = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });
const NUM0 = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

/**
 * Variación contra el período anterior. Conteos en %; notas en décimas (una nota de 4,1 a 4,4
 * es "+0,3", no "+7%"); tasas en puntos porcentuales. null si no hay comparación posible.
 */
export function variacion(c: Cifra): Variacion | null {
  if (!c.compara || c.actual == null) return null;
  if (c.formato === "numero") {
    const ant = c.anterior ?? 0;
    if (ant === 0) {
      return c.actual > 0
        ? { texto: "Nuevo", signo: 1, aria: "Sin registros en el período anterior" }
        : { texto: "0%", signo: 0, aria: "Sin cambios" };
    }
    const pct = ((c.actual - ant) / ant) * 100;
    const r = Math.round(pct);
    return { texto: `${NUM0.format(Math.abs(r))}%`, signo: r > 0 ? 1 : r < 0 ? -1 : 0, aria: `${r >= 0 ? "Sube" : "Baja"} ${NUM0.format(Math.abs(r))}%` };
  }
  if (c.anterior == null) return null;
  const diff = c.actual - c.anterior;
  if (c.formato === "nota") {
    const r = Math.round(diff * 10) / 10;
    return { texto: NUM1.format(Math.abs(r)), signo: r > 0 ? 1 : r < 0 ? -1 : 0, aria: `${r >= 0 ? "Sube" : "Baja"} ${NUM1.format(Math.abs(r))} puntos` };
  }
  const r = Math.round(diff);
  return { texto: `${NUM0.format(Math.abs(r))} pp`, signo: r > 0 ? 1 : r < 0 ? -1 : 0, aria: `${r >= 0 ? "Sube" : "Baja"} ${NUM0.format(Math.abs(r))} puntos porcentuales` };
}

/** Valor formateado de una cifra. */
export function formatCifra(c: Pick<Cifra, "actual" | "formato">, vacio = "Sin datos"): string {
  if (c.actual == null) return vacio;
  if (c.formato === "nota") return c.actual.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (c.formato === "pct") return `${NUM0.format(c.actual)}%`;
  return NUM0.format(c.actual);
}

/** Primer instante con datos entre varias listas de fechas (para "todo"). */
export function primeraFecha(...listas: (string | null | undefined)[][]): number | null {
  let min: number | null = null;
  for (const l of listas) for (const f of l) {
    const t = ms(f);
    if (t != null && (min == null || t < min)) min = t;
  }
  return min;
}

type SP = Record<string, string | string[] | undefined>;

/**
 * Cierra el período después de leer los datos: en "todo" la agrupación automática y el primer
 * tramo dependen de la fecha del primer registro. Devuelve el período final y sus tramos.
 */
export function cerrarPeriodo(
  sp: SP,
  now: number,
  p0: Periodo,
  ...fechas: (string | null | undefined)[][]
): { p: Periodo; tramos: Tramo[] } {
  if (p0.desde != null) return { p: p0, tramos: construirTramos(p0, null) };
  const inicio = primeraFecha(...fechas);
  const p = resolverPeriodo(sp, now, inicio);
  return { p, tramos: construirTramos(p, inicio) };
}
