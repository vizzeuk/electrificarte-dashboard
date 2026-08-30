import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { TrendBadge } from "@/components/trend-badge";
import { cn } from "@/lib/utils";

/** Callout grande para UN dato destacado — el "hero" de analítica y el teaser en Resumen.
 * Superficie negra con acento cyan (el recurso dramático del sitio): se lee como el dato
 * más importante de la pantalla. Sin gradientes ni relleno decorativo. */
export function FeaturedInsightCard({
  icon: Icon,
  eyebrow,
  title,
  description,
  trendPct,
  href,
  hrefLabel = "Ver analítica completa",
  className,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  trendPct?: number;
  href?: string;
  hrefLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-black p-8 text-white sm:p-10",
        className,
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <div className="text-primary flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
            <Icon className="size-4" />
            {eyebrow}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
            {trendPct !== undefined && <TrendBadge pct={trendPct} />}
          </div>
          <p className="max-w-xl text-sm text-white/70 sm:text-base">{description}</p>
        </div>
        {href && (
          <Link
            href={href}
            className="group bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-1.5 self-start rounded-xl px-5 py-3 text-sm font-bold transition-colors hover:bg-[#00c2c2] sm:self-center"
          >
            {hrefLabel}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
