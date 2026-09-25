import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estrellas en Tinta (como las reseñas de la web); las vacías en Línea fuerte. */
export function Estrellas({ n, className }: { n: number | null | undefined; className?: string }) {
  const v = Math.round(n ?? 0);
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${n ?? 0} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn("size-4", i < v ? "fill-foreground text-foreground" : "text-input")}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </span>
  );
}
