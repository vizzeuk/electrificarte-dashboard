import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FunnelStep } from "@/lib/mock/types";

/** Embudo de conversión: barras horizontales con ancho proporcional al paso anterior + caída %
 * entre pasos — la vista más directa de "dónde se pierde gente" para justificar el valor de la
 * analítica. */
export function FunnelCard({
  title,
  description,
  steps,
}: {
  title: string;
  description?: string;
  steps: FunnelStep[];
}) {
  const max = steps[0]?.usuarios || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-3">
        {steps.map((step, i) => {
          const widthPct = (step.usuarios / max) * 100;
          const prev = steps[i - 1];
          const retentionPct = prev ? Math.round((step.usuarios / prev.usuarios) * 100) : null;
          return (
            <div key={step.paso}>
              {retentionPct !== null && (
                <p className="text-muted-foreground py-1 text-xs">↓ {retentionPct}% continúa</p>
              )}
              <div className="flex items-center justify-between gap-3 pb-1">
                <span className="truncate text-sm font-medium">{step.paso}</span>
                <span className="shrink-0 text-sm font-semibold tabular-nums">{step.usuarios.toLocaleString("es-CL")}</span>
              </div>
              <div className="bg-muted h-3 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full transition-all"
                  style={{ width: `${Math.max(widthPct, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
