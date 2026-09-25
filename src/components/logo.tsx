/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"

/**
 * Logo de Electrificarte (wordmark en Tinta, public/brand/). En el tema oscuro se invierte
 * para quedar en Niebla, igual que el footer oscuro de la web.
 *  - "wordmark": el logo completo.
 *  - "mark": solo la primera letra del wordmark (sidebar colapsado).
 */
export function Logo({
  variant = "wordmark",
  className,
}: {
  variant?: "wordmark" | "mark"
  className?: string
}) {
  if (variant === "mark") {
    return (
      <span className={cn("block h-5 w-[17px] overflow-hidden", className)} aria-label="Electrificarte">
        <img src="/brand/electrificarte-wordmark.webp" alt="" className="h-5 w-auto max-w-none dark:invert" />
      </span>
    )
  }
  return (
    <img
      src="/brand/electrificarte-wordmark.webp"
      alt="Electrificarte"
      className={cn("h-4 w-auto dark:invert", className)}
    />
  )
}
