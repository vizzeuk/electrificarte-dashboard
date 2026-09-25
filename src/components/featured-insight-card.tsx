import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrendBadge } from "@/components/trend-badge";
import { cn } from "@/lib/utils";

/**
 * El bloque destacado de la pantalla (Glaciar, uno solo por pantalla): UN dato que importa más
 * que el resto. Macizo, sin degradados ni sombra. Es Glaciar en ambos temas, por eso el botón
 * usa los primitivos (Laguna) en vez de bg-primary, que en oscuro también sería Glaciar.
 */
export function FeaturedInsightCard({
  label,
  title,
  description,
  trendPct,
  href,
  hrefLabel = "Ver analítica completa",
  className,
}: {
  /** Frase corta arriba del título, en sentence case (no es un eyebrow en mayúsculas). */
  label?: string;
  title: string;
  description: string;
  trendPct?: number;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  return (
    <section className={cn("bg-accent-soft text-on-accent-soft rounded-card p-6 sm:p-8", className)}>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {label && <p className="text-small font-semibold">{label}</p>}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-h3 font-bold">{title}</h2>
            {trendPct !== undefined && <TrendBadge pct={trendPct} className="bg-tinta text-papel" />}
          </div>
          <p className="mt-3 max-w-xl text-base">{description}</p>
        </div>
        {href && (
          <Link
            href={href}
            className="group bg-laguna text-papel hover:bg-laguna-hover inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-control px-5 text-[15px] font-semibold transition-colors focus-visible:outline-tinta sm:self-auto"
          >
            {hrefLabel}
            <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-[3px]" strokeWidth={1.5} />
          </Link>
        )}
      </div>
    </section>
  );
}
