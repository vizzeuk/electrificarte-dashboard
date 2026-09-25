import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatNumero } from "@/lib/utils";

interface TopListItem {
  label: string;
  sublabel?: string;
  value: number;
}

/** Ranking con barra proporcional. La fila #1 va en negrita; sin fondos tintados. */
export function TopList({
  title,
  description,
  items,
  valueLabel = "visitas",
}: {
  title: string;
  description?: string;
  items: TopListItem[];
  valueLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-3.5">
          {items.map((item, i) => (
            <li key={item.label} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-small">
                <span className={cn("min-w-0 truncate", i === 0 ? "font-semibold" : "font-medium")}>
                  <span className="text-muted-foreground mr-2 tabular-nums">{i + 1}</span>
                  {item.label}
                  {item.sublabel && <span className="text-muted-foreground ml-1.5 font-normal">{item.sublabel}</span>}
                </span>
                <span className={cn("shrink-0 tabular-nums", i === 0 ? "font-semibold" : "text-muted-foreground")}>
                  {formatNumero(item.value)} {valueLabel}
                </span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-chip" aria-hidden>
                <div className="bg-primary h-full rounded-chip" style={{ width: `${Math.max((item.value / max) * 100, 2)}%` }} />
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
