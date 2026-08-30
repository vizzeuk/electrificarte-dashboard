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
