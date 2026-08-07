import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendBadge } from "@/components/trend-badge";
import { cn } from "@/lib/utils";

interface RankingItem {
  label: string;
  sublabel?: string;
  value: number;
  trendPct: number;
}

/** Como TopList, pero para variaciones (modelos en tendencia) — cada fila lleva su propio
 * TrendBadge en vez de una barra de progreso, y la fila #1 se destaca (fondo tintado + texto más
 * grande) para que el dato más importante no compita visualmente con el resto. */
export function RankingCard({
  title,
  description,
  items,
  valueLabel = "visitas",
}: {
  title: string;
  description?: string;
  items: RankingItem[];
  valueLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-1.5">
        {items.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              "flex items-center justify-between gap-3 rounded-lg px-2.5 py-2",
              i === 0 && "bg-primary/8 border border-primary/15"
            )}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="text-muted-foreground w-4 shrink-0 text-sm tabular-nums">{i + 1}</span>
              <span className="min-w-0">
                <span className={cn("block truncate font-medium", i === 0 && "text-base")}>{item.label}</span>
                {item.sublabel && <span className="text-muted-foreground text-xs">{item.sublabel}</span>}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className={cn("text-muted-foreground text-sm tabular-nums", i === 0 && "text-foreground font-medium")}>
                {item.value.toLocaleString("es-CL")} {valueLabel}
              </span>
              <TrendBadge pct={item.trendPct} />
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
