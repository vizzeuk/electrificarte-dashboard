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
  anio: number;
  tipo: string;
  electrificacion: string;
  url_oficial: string;
  versiones: PdpVersion[];
}

export interface PdpSolicitud {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  /** El contrato no los lista para la vista, pero la fila los guarda: se usan para "Corregir". */
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
  /** Si la web lo manda, marca el último cambio de estado (para la regla de los 30 min). */
  updated_at?: string | null;
  terminada_at?: string | null;
  intentos?: number | null;
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

/** Estados que el contrato no nombra pero la web podría usar (p. ej. al cancelar). */
const OTROS: Record<string, (typeof ESTADOS)[PdpEstado]> = {
  cancelada: { label: "Cancelada", variant: "secondary" },
};

export function estadoInfo(estado: string) {
  const conocido = ESTADOS[estado as PdpEstado] ?? OTROS[estado];
  if (conocido) return conocido;
  const t = (estado || "sin estado").replace(/_/g, " ");
  return { label: t.charAt(0).toLocaleUpperCase("es-CL") + t.slice(1), variant: "outline" as const };
}

/** Mientras haya alguna en estos estados, la lista se refresca sola. */
export const ESTADOS_ACTIVOS: string[] = ["listo", "en cola", "procesando"];

export const esActiva = (s: Pick<PdpSolicitud, "estado">) => ESTADOS_ACTIVOS.includes(s.estado);

const TREINTA_MIN = 30 * 60_000;

/** Último movimiento conocido de la solicitud (el contrato no define un campo propio). */
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
}

export function accionesDe(s: PdpSolicitud, now: number): Acciones {
  const pegada = (s.estado === "en cola" || s.estado === "procesando") && now - ultimoMovimiento(s) > TREINTA_MIN;
  const fallida = s.estado === "sin_datos" || s.estado === "error";
  return {
    cancelar: s.estado === "listo",
    reintentar: pegada || fallida,
    corregir: fallida,
    studio: Boolean(s.studio_url) && (s.estado === "listo_para_revisar" || s.estado === "borrador_incompleto"),
    pegada,
  };
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

const USD = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export function formatUsd(v: number | null | undefined): string | null {
  return v == null ? null : `US$${USD.format(v)}`;
}

export const nombrePdp = (s: Pick<PdpSolicitud, "marca" | "modelo" | "anio">) =>
  [s.marca, s.modelo, s.anio].filter(Boolean).join(" ");
