import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesTip } from "@/lib/mock/sales-tips";

/** Capa de "qué hacer con esto" sobre la analítica cruda — el diferencial que justifica que un
 * vendedor pague por esto y no solo por los números. Mismo tratamiento visual amber que ya usa
 * kpi-card.tsx para "atención" — nada de colores nuevos. */
export function SalesTipsCard({ tips }: { tips: SalesTip[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tips de venta para esta semana</CardTitle>
        <CardDescription>Sugerencias accionables en base a la analítica de más abajo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {tips.map((tip) => (
          <div key={tip.title} className="flex gap-3 rounded-lg bg-amber-500/8 border border-amber-500/15 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Lightbulb className="size-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{tip.title}</p>
              <p className="text-muted-foreground text-sm">{tip.detail}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
