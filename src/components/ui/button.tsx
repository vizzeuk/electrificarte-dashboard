"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Sistema v1: radio 8, alturas 40/48/56, sin sombra. El foco lo pinta la regla global
// :focus-visible (contorno sólido de 2 px en Laguna, Glaciar en oscuro).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-[18px] shrink-0 [&_svg]:shrink-0 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // Primario: uno solo por bloque.
        default: "bg-primary text-primary-foreground hover:bg-primary-hover",
        destructive:
          "border border-destructive bg-background text-destructive hover:bg-destructive hover:text-primary-foreground",
        // Secundario: borde Línea fuerte, hover a Tinta.
        outline: "border border-input bg-background text-foreground hover:border-foreground",
        secondary: "border border-transparent bg-secondary text-secondary-foreground hover:border-input",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "h-auto px-0 text-link underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-5 text-[15px] has-[>svg]:px-4",
        sm: "h-10 px-4 text-small has-[>svg]:px-3",
        lg: "h-14 px-6 text-base has-[>svg]:px-5",
        icon: "size-12",
        "icon-sm": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
