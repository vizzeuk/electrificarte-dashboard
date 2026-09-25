import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FunnelStep } from "@/lib/mock/types";

/** Embudo de conversión: barras con ancho proporcional al primer paso y el porcentaje que sigue
 * entre pasos. La vista más directa de dónde se pierde gente. */
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
      <CardContent className="flex flex-col gap-1">
        {steps.map((step, i) => {
          const widthPct = (step.usuarios / max) * 100;
          const prev = steps[i - 1];
          const retentionPct = prev ? Math.round((step.usuarios / prev.usuarios) * 100) : null;
          return (
            <div key={step.paso}>
              {retentionPct !== null && (
                <p className="text-muted-foreground py-1 text-micro">{retentionPct}% sigue al paso siguiente</p>
              )}
              <div className="flex items-center justify-between gap-3 pb-1">
                <span className="truncate text-small font-medium">{step.paso}</span>
                <span className="shrink-0 text-small font-semibold tabular-nums">{step.usuarios.toLocaleString("es-CL")}</span>
              </div>
              <div className="bg-muted h-2.5 overflow-hidden rounded-chip">
                <div
                  className="bg-primary h-full rounded-chip"
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
