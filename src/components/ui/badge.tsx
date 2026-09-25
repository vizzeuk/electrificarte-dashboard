"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Chip del sistema v1: macizo, 24 px de alto, radio 4, 12 px. Sin variantes translúcidas.
const badgeVariants = cva(
  "inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-chip border px-2 text-micro font-semibold [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        // Sólido (Tinta): el dato que más importa en la fila.
        default: "border-transparent bg-foreground text-background",
        // Suave (Glaciar): estado positivo o destacado.
        soft: "border-transparent bg-accent-soft text-on-accent-soft",
        // Neutro sobre Niebla: estado cerrado o sin acción.
        secondary: "border-transparent bg-muted text-muted-foreground",
        // Contorno: estado neutro o pendiente.
        outline: "border-input bg-background text-foreground",
        // Error real (no urgencia).
        destructive: "border-destructive bg-background text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
