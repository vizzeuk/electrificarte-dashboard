import * as React from "react"

import { cn } from "@/lib/utils"

// Campo del sistema v1: 48 px, texto de 16 px (en móvil menos hace zoom en iOS), radio 8,
// borde Línea fuerte, sin sombra. El foco lo pinta la regla global :focus-visible.
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-control border border-input bg-background px-3.5 text-base text-foreground transition-colors placeholder:text-muted-foreground hover:border-ink-3 focus-visible:border-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-small file:font-medium file:text-foreground",
        "aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
