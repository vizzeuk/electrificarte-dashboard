import { cn } from "@/lib/utils"

// Bloque de carga: macizo y quieto (el sistema no usa animaciones de atención).
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-control bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
