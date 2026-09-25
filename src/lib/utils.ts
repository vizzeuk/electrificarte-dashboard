import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// tailwind-merge tiene que conocer la escala del sistema v1 (tokens.css): si no, lee
// `text-micro` como un color, lo "resuelve" contra `text-foreground` y borra el tamaño.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display", "h1", "h2", "h3", "h4", "lead", "body", "small", "label", "micro", "price", "price-lg", "stat"],
      radius: ["chip", "control", "card", "round"],
    },
  },
})

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
  if (value == null) return "Sin dato"
  return CLP.format(value)
}

const TZ = "America/Santiago"

const FECHA = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ })
const FECHA_CORTA = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", timeZone: TZ })
const FECHA_HORA = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ,
})
const NUM = new Intl.NumberFormat("es-CL")

function parse(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/** Fecha ISO a es-CL corta, en hora de Chile: "2026-08-29T..." → "29-08-2026". */
export function formatFecha(value: string | null | undefined): string {
  const d = parse(value)
  return d ? FECHA.format(d) : "Sin fecha"
}

/** "12 sept." (para listas compactas). */
export function formatFechaCorta(value: string | null | undefined): string {
  const d = parse(value)
  return d ? FECHA_CORTA.format(d) : "Sin fecha"
}

/** "29-08-2026, 14:05" en hora de Chile (24 h). */
export function formatFechaHora(value: string | null | undefined): string {
  const d = parse(value)
  return d ? FECHA_HORA.format(d) : "Sin fecha"
}

/** Número en formato chileno: 1234567 → "1.234.567". */
export function formatNumero(value: number | null | undefined): string {
  return value == null ? "0" : NUM.format(value)
}

/** "hace 3 días", relativo a `now` (se pasa desde el servidor para que no cambie al hidratar). */
export function hace(value: string | null | undefined, now: number): string {
  const d = parse(value)
  if (!d) return ""
  const min = Math.floor((now - d.getTime()) / 60_000)
  if (min < 1) return "recién"
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const dias = Math.floor(h / 24)
  if (dias < 31) return `hace ${dias} día${dias === 1 ? "" : "s"}`
  const meses = Math.floor(dias / 30.4)
  if (meses < 12) return `hace ${meses} mes${meses === 1 ? "" : "es"}`
  const anos = Math.floor(dias / 365)
  return `hace ${anos} año${anos === 1 ? "" : "s"}`
}

/** Nombre completo a partir de sus partes; null si no hay ninguna. */
export function nombreCompleto(...partes: (string | null | undefined)[]): string | null {
  const n = partes.map((p) => p?.trim()).filter(Boolean).join(" ")
  return n || null
}

/** Link de WhatsApp (solo dígitos). Un número chileno de 9 dígitos se completa con 56. */
export function waLink(phone: string | null | undefined): string | null {
  const d = (phone ?? "").replace(/\D/g, "")
  if (d.length < 8) return null
  const full = d.length === 9 && d.startsWith("9") ? `56${d}` : d
  return `https://wa.me/${full}`
}

export const SITIO = "https://www.electrificarte.com"

/** Ficha del auto en la web si el valor parece un slug ("byd-dolphin-mini"). */
export function autoUrl(slugOModelo: string | null | undefined): string | null {
  const v = (slugOModelo ?? "").trim()
  return /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(v) ? `${SITIO}/auto/${v}` : null
}

/** "suzuki-across" → "Suzuki Across" (para mostrar un slug como nombre). */
export function slugATitulo(v: string | null | undefined): string {
  const s = (v ?? "").trim()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(s)) return s
  return s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
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
