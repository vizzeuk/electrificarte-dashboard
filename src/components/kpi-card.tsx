import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendBadge } from "@/components/trend-badge";
import { Sparkline } from "@/components/sparkline";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  accent?: "primary" | "amber" | "green" | "muted";
  /** Serie chica para un sparkline debajo del valor (opcional). */
  trend?: number[];
  /** Variación % vs. el período anterior — pastilla junto al valor. */
  deltaPct?: number;
}

const ICON_CLS: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  primary: "text-primary",
  amber: "text-amber-600 dark:text-amber-400",
  green: "text-emerald-600 dark:text-emerald-400",
  muted: "text-muted-foreground",
};

export function KpiCard({ label, value, icon: Icon, hint, accent = "primary", trend, deltaPct }: KpiCardProps) {
  return (
    <Card className="rounded-2xl transition-colors hover:border-primary/40">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
            {label}
          </p>
          <Icon className={cn("size-4 shrink-0", ICON_CLS[accent])} />
        </div>
        <div className="flex items-end gap-2">
          <p className="font-display text-4xl font-bold leading-none tabular-nums">{value}</p>
          {deltaPct !== undefined && <TrendBadge pct={deltaPct} />}
        </div>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        {trend && trend.length > 1 && <Sparkline data={trend} />}
      </CardContent>
    </Card>
  );
}
