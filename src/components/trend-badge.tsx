import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pastilla ▲/▼ + %, para variaciones (KPIs, ranking de modelos en tendencia). Mismos tokens que
 * ya usa kpi-card.tsx (emerald para positivo, destructive para negativo) — nada nuevo. */
export function TrendBadge({ pct, className }: { pct: number; className?: string }) {
  const positive = pct >= 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums",
        positive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive",
        className
      )}
    >
      <Icon className="size-3" />
      {Math.abs(pct)}%
    </span>
  );
}
