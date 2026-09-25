import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendBadge } from "@/components/trend-badge";
import { cn, formatNumero } from "@/lib/utils";

interface RankingItem {
  label: string;
  sublabel?: string;
  value: number;
  trendPct: number;
}

/** Como TopList, pero para variaciones (modelos en tendencia): cada fila lleva su variación. */
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
      <CardContent>
        <ol className="divide-y">
          {items.map((item, i) => (
            <li key={item.label} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="flex min-w-0 items-center gap-3">
                <span className="text-muted-foreground w-4 shrink-0 text-small tabular-nums">{i + 1}</span>
                <span className="min-w-0">
                  <span className={cn("block truncate text-small", i === 0 ? "font-semibold" : "font-medium")}>{item.label}</span>
                  {item.sublabel && <span className="text-muted-foreground block text-micro">{item.sublabel}</span>}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-muted-foreground text-small tabular-nums">
                  {formatNumero(item.value)} {valueLabel}
                </span>
                <TrendBadge pct={item.trendPct} />
              </span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
