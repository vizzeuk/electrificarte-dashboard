import type { LucideIcon } from "lucide-react";
import { TrendBadge } from "@/components/trend-badge";
import { Sparkline } from "@/components/sparkline";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  /** Ícono suelto junto a la etiqueta (opcional, del color del texto). */
  icon?: LucideIcon;
  hint?: string;
  /** Se mantiene por compatibilidad; el sistema v1 no colorea las cifras. */
  accent?: string;
  /** Serie chica para un sparkline debajo del valor (opcional). */
  trend?: number[];
  /** Variación % vs. el período anterior, junto al valor. */
  deltaPct?: number;
  className?: string;
}

/**
 * Cifra con hairline arriba (como `.kpi` de la web). Server Component a propósito: recibe
 * `icon` como referencia de componente, que no cruza el límite RSC si fuera cliente.
 */
export function KpiCard({ label, value, icon: Icon, hint, trend, deltaPct, className }: KpiCardProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2 border-t pt-4", className)}>
      <p className="text-muted-foreground flex items-center gap-2 text-small font-medium">
        {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />}
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-price-lg leading-none font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
        {deltaPct !== undefined && <TrendBadge pct={deltaPct} />}
      </div>
      {hint && <p className="text-muted-foreground text-micro">{hint}</p>}
      {trend && trend.length > 1 && <Sparkline data={trend} />}
    </div>
  );
}
