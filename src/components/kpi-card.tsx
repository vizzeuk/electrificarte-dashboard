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
  /** Serie chica para un sparkline debajo del valor (opcional — sin esto se ve igual que antes). */
  trend?: number[];
  /** Variación % vs. el período anterior — se muestra como pastilla junto al valor. */
  deltaPct?: number;
}

const ACCENT_CLS: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  primary: "bg-primary/10 text-primary",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  muted: "bg-muted text-muted-foreground",
};

export function KpiCard({ label, value, icon: Icon, hint, accent = "primary", trend, deltaPct }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-3xl font-semibold tabular-nums">{value}</p>
            {deltaPct !== undefined && <TrendBadge pct={deltaPct} />}
          </div>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {trend && trend.length > 1 && <Sparkline data={trend} />}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", ACCENT_CLS[accent])}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
