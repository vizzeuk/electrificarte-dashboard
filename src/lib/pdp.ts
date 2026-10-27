/**
 * Tipos y reglas de presentación de las solicitudes de PDP (creación de fichas desde el panel).
 * El contrato es de la web (`/api/admin/pdp/*` en electrificarteweb): acá solo se describe.
 * Este archivo NO toca la red ni secretos, así que lo pueden importar componentes de cliente.
 * Las llamadas viven en `lib/pdp-api.ts` (solo servidor).
 */

export type PdpEstado =
  | "listo"
  | "en cola"
  | "procesando"
  | "listo_para_revisar"
  | "borrador_incompleto"
  | "sin_datos"
  | "rechazada"
  | "error";

export interface PdpVersion {
  nombre: string;
  /** Pesos chilenos, entero. Precio de lista, sin bonos. */
  precio: number;
  /**
   * Opcionales: solo cuando la versión es de otra carrocería o electrificación que el modelo
   * (ej. la versión EV de un modelo híbrido). Mismos `valor` de `/opciones`. "Igual que el
   * modelo" = la clave no va (ni "" ni null); la web los guarda solo si difieren del modelo.
   */
  tipo?: string | null;
  electrificacion?: string | null;
  /**
   * Ficha técnica (PDF) de ESTA versión, ya subida con `subirFichaPdp` (oct-2026). Opcional. Viaja
   * dentro de `versiones`: en "Corregir", una versión que la conserva la vuelve a mandar.
   */
  ficha_file_id?: string | null;
  ficha_nombre?: string | null;
}

export interface PdpOpciones {
  marcas: { valor: string; slug: string; sitio?: string | null }[];
  tipos: { valor: string; slug: string }[];
  electrificaciones: { valor: string; nombre: string }[];
  anioMin: number;
  anioMax: number;
}

/** Lo que manda el formulario (sin `creado_por`: ese lo pone el servidor). */
export interface PdpDatos {
  marca: string;
  modelo: string;
  /** Opcional (oct-2026): null = no declarado. */
  anio: number | null;
  tipo: string;
  electrificacion: string;
  /** Opcional: null = el agente busca la ficha en el sitio oficial de la marca. */
  url_oficial: string | null;
  /** Opcional: [] = el precio sale de la fuente oficial (con cita) y se confirma en Studio. */
  versiones: PdpVersion[];
  /**
   * Ficha técnica (PDF) ya subida con `subirFichaPdp`. Opcional. En "Corregir": sin la clave se
   * conserva la que tenía, `null` la quita.
   */
  ficha_file_id?: string | null;
  ficha_nombre?: string | null;
}

export interface PdpSolicitud {
  id: string;
  marca: string;
  modelo: string;
  anio: number | null;
  /** La web devuelve la fila completa de `pdp_solicitudes`: estos se usan para "Corregir". */
  tipo?: string | null;
  electrificacion?: string | null;
  url_oficial?: string | null;
  versiones: PdpVersion[];
  estado: PdpEstado | (string & {});
  detalle?: string | null;
  mensaje?: string | null;
  studio_url?: string | null;
  lote?: string | null;
  costo_usd?: number | null;
  creado_por?: string | null;
  created_at: string;
  /** Último cambio de la fila (trigger en Supabase): la web cuenta los 30 min desde acá. */
  updated_at?: string | null;
  terminada_at?: string | null;
  intentos?: number | null;
  /** Ficha técnica adjunta (oct-2026). Sin la migración de la web, no viene. */
  ficha_file_id?: string | null;
  ficha_nombre?: string | null;
}

/** Resultado de una acción del panel, ya traducido para la UI (serializable). */
export type PdpResultado<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      /** errores = 422/409 (accionables), config = 401/variables, fallo = 500/red/timeout. */
      tipo: "errores" | "conflicto" | "config" | "fallo" | "no_autorizado";
      errores: string[];
    };

export const ESTADOS: Record<PdpEstado, { label: string; variant: "default" | "soft" | "secondary" | "outline" | "destructive" }> = {
  listo: { label: "En espera", variant: "outline" },
  "en cola": { label: "Tomada", variant: "outline" },
  procesando: { label: "Investigando (~3 min)", variant: "default" },
  listo_para_revisar: { label: "Lista para revisar", variant: "soft" },
  borrador_incompleto: { label: "Borrador con faltantes", variant: "outline" },
  sin_datos: { label: "No encontró datos", variant: "secondary" },
  rechazada: { label: "Rechazada", variant: "secondary" },
  error: { label: "Error", variant: "destructive" },
};

export const ORDEN_ESTADOS = Object.keys(ESTADOS) as PdpEstado[];

export function estadoInfo(estado: string) {
  const conocido = ESTADOS[estado as PdpEstado];
  if (conocido) return conocido;
  const t = (estado || "sin estado").replace(/_/g, " ");
  return { label: t.charAt(0).toLocaleUpperCase("es-CL") + t.slice(1), variant: "outline" as const };
}

/** Mientras haya alguna en estos estados, la lista se refresca sola. */
export const ESTADOS_ACTIVOS: string[] = ["listo", "en cola", "procesando"];

export const esActiva = (s: Pick<PdpSolicitud, "estado">) => ESTADOS_ACTIVOS.includes(s.estado);

const TREINTA_MIN = 30 * 60_000;

/** Último movimiento de la solicitud: misma regla que `sePuedeReintentar` en la web (updated_at). */
function ultimoMovimiento(s: PdpSolicitud): number {
  const t = new Date(s.updated_at ?? s.created_at).getTime();
  return isNaN(t) ? Date.now() : t;
}

export interface Acciones {
  cancelar: boolean;
  reintentar: boolean;
  corregir: boolean;
  studio: boolean;
  /** "en cola"/"procesando" con más de 30 min: probablemente se quedó pegada. */
  pegada: boolean;
  /**
   * "listo" con más de 30 min: n8n no la tomó (VPS caída, o el webhook y el cron fallaron). La web
   * nueva la pasa a "error" en el próximo GET; esto cubre una web sin barrido y los segundos hasta
   * ese GET. Reintentar no sirve: la deja otra vez en "listo". Hay que revisar n8n.
   */
  sinTomar: boolean;
}

export function accionesDe(s: PdpSolicitud, now: number): Acciones {
  // Desde oct-2026 la web pasa las trabadas a "error" sola (con la razón); esto queda para una
  // web vieja y para los segundos antes del próximo GET.
  const pegada = (s.estado === "en cola" || s.estado === "procesando") && now - ultimoMovimiento(s) > TREINTA_MIN;
  // Mismos estados que acepta /reintentar en la web (lib/pdp-creacion/solicitudes.ts). "rechazada"
  // suele ser que la PDP ya existe en Sanity: reintentar sin corregir vuelve a fallar, pero
  // corrigiendo el modelo sí puede servir.
  const fallida = s.estado === "sin_datos" || s.estado === "error" || s.estado === "rechazada";
  return {
    cancelar: s.estado === "listo",
    reintentar: pegada || fallida,
    corregir: fallida,
    studio: Boolean(s.studio_url) && (s.estado === "listo_para_revisar" || s.estado === "borrador_incompleto"),
    pegada,
    sinTomar: s.estado === "listo" && now - ultimoMovimiento(s) > TREINTA_MIN,
  };
}

/** Mismo formato que acepta la web para el id de una ficha subida. */
export const esFichaId = (v: unknown): v is string => typeof v === "string" && /^file_[A-Za-z0-9_-]{6,}$/.test(v);

/** Ficha técnica: lo mismo que acepta la web (Vercel corta los request de más de 4,5 MB). */
export const FICHA_MAX_BYTES = 4 * 1024 * 1024;

/** null si sirve; si no, el error para el formulario. Los bytes mandan, no la extensión. */
export function validarFicha(tamano: number, primeros: Uint8Array): string | null {
  if (tamano === 0) return "El archivo está vacío.";
  if (tamano > FICHA_MAX_BYTES) return `Pesa ${(tamano / 1024 / 1024).toFixed(1)} MB y el máximo es 4 MB. Sube solo la ficha técnica, no el catálogo completo.`;
  if (String.fromCharCode(...primeros.subarray(0, 5)) !== "%PDF-") return "Tiene que ser un PDF.";
  return null;
}

const PUNTOS = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 });

/** 24990000 → "24.990.000" (para el campo de precio mientras se escribe). */
export function conPuntos(n: number | string): string {
  const d = String(n).replace(/\D/g, "");
  return d ? PUNTOS.format(Number(d)) : "";
}

/** "24.990.000" → 24990000. Vacío → NaN. */
export function sinPuntos(s: string): number {
  const d = s.replace(/\D/g, "");
  return d ? Number(d) : NaN;
}

/**
 * Precio "desde" de la PDP, misma regla que la web: la versión más barata **de la electrificación
 * del modelo** (una de otra tecnología no cuenta aunque sea más barata). Sin precios → null.
 */
export function precioBase(versiones: Pick<PdpVersion, "precio" | "electrificacion">[], electrificacionModelo?: string | null): number | null {
  const delModelo = versiones.filter((v) => v.precio > 0 && (!v.electrificacion || v.electrificacion === electrificacionModelo));
  return delModelo.length ? Math.min(...delModelo.map((v) => v.precio)) : null;
}

/** Lo que la versión tiene distinto del modelo, para mostrarlo junto al nombre: "EV, SUV". */
export const diferenciasVersion = (v: Pick<PdpVersion, "tipo" | "electrificacion">) =>
  [v.electrificacion, v.tipo].filter(Boolean).join(", ");

const USD = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function formatUsd(v: number | null | undefined): string | null {
  return v == null ? null : `US$${USD.format(v)}`;
}

export const nombrePdp = (s: Pick<PdpSolicitud, "marca" | "modelo" | "anio">) =>
  [s.marca, s.modelo, s.anio].filter(Boolean).join(" ");
