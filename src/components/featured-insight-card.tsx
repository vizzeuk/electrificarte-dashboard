import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { TrendBadge } from "@/components/trend-badge";
import { cn } from "@/lib/utils";

/** Callout grande para UN dato destacado — el "hero" de la página de analítica y el teaser en
 * Resumen. Deliberadamente más grande y con más presencia que una KpiCard normal (texto más
 * grande, fondo tintado con el primary del tema) para que se lea como el dato más importante de
 * la pantalla, no uno más entre varios. Usa solo tokens ya definidos (primary/accent). */
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
        "relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-accent/40 to-transparent p-6 sm:p-8",
        className
      )}
    >
      <div
        aria-hidden
        className="absolute -top-10 -right-10 size-40 rounded-full bg-primary/15 blur-2xl"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-accent-foreground">
            <Icon className="size-6" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{eyebrow}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
              {trendPct !== undefined && <TrendBadge pct={trendPct} />}
            </div>
            <p className="text-muted-foreground max-w-xl text-sm sm:text-base">{description}</p>
          </div>
        </div>
        {href && (
          <Link
            href={href}
            className="group inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border bg-background/80 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-background sm:self-center"
          >
            {hrefLabel}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
