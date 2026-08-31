import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CLP = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
})

/** Formatea un monto en CLP: 21500000 → "$21.500.000". */
export function formatCLP(value: number | null | undefined): string {
  if (value == null) return "—"
  return CLP.format(value)
}

/** Formatea una fecha ISO a es-CL corta: "2026-08-29T..." → "29-08-2026". */
export function formatFecha(value: string | null | undefined): string {
  if (!value) return "—"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" })
}

/**
 * Ventana de oferta de un lead. El lead está abierto para pujas hasta `cierra_at`
 * (típicamente 48-96 h). La urgencia diferencia visualmente los que están por cerrar:
 * es lo que le dice al vendedor "ofertá ahora o lo perdés".
 */
export type LeadUrgency = "expirado" | "critico" | "urgente" | "normal"

export interface RemainingInfo {
  /** Milisegundos restantes; negativo si ya cerró. */
  ms: number
  urgency: LeadUrgency
  /** Etiqueta corta: "2d 4h", "5h 20m", "45m", "Cerrado". */
  label: string
}

const HOUR_MS = 3_600_000

/** ≤6 h = crítico, ≤24 h = urgente, más = normal. `now` es inyectable para testear
 *  y para que el componente cliente lo actualice cada minuto. */
export function leadRemaining(
  cierraAt: string | null | undefined,
  now: number = Date.now(),
): RemainingInfo | null {
  if (!cierraAt) return null
  const end = new Date(cierraAt).getTime()
  if (isNaN(end)) return null
  const ms = end - now
  if (ms <= 0) return { ms, urgency: "expirado", label: "Cerrado" }
  const urgency: LeadUrgency = ms <= 6 * HOUR_MS ? "critico" : ms <= 24 * HOUR_MS ? "urgente" : "normal"
  return { ms, urgency, label: formatRemaining(ms) }
}

function formatRemaining(ms: number): string {
  const totalMin = Math.floor(ms / 60_000)
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}
