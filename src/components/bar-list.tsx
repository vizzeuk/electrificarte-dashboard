import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumero } from "@/lib/utils";

/** Ranking con barra proporcional (Laguna sobre Niebla). Para desgloses chicos y reales. */
export function BarList({
  title,
  description,
  items,
  max = 6,
  empty = "Todavía no hay datos.",
}: {
  title: string;
  description?: string;
  items: { label: string; value: number }[];
  max?: number;
  empty?: string;
}) {
  const top = [...items].sort((a, b) => b.value - a.value).slice(0, max);
  const tope = Math.max(...top.map((i) => i.value), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {top.length === 0 ? (
          <p className="text-muted-foreground text-small">{empty}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {top.map((it) => (
              <li key={it.label} className="grid gap-1.5">
                <div className="flex items-baseline justify-between gap-3 text-small">
                  <span className="truncate font-medium">{it.label}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">{formatNumero(it.value)}</span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-chip" aria-hidden>
                  <div className="bg-primary h-full rounded-chip" style={{ width: `${Math.max((it.value / tope) * 100, 2)}%` }} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

/** Cuenta ocurrencias de una clave, con etiqueta para el vacío. */
export function contarPor<T>(rows: T[], get: (r: T) => string | null | undefined, vacio = "Sin dato") {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = (get(r) ?? "").trim() || vacio;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([label, value]) => ({ label, value }));
}
