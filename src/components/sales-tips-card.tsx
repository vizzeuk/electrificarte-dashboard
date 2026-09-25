import { Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SalesTip } from "@/lib/mock/sales-tips";

/** Capa de "qué hacer con esto" sobre la analítica: tips cruzados con las marcas del vendedor.
 * Lista con hairlines e ícono suelto; sin colores de urgencia. */
export function SalesTipsCard({ tips }: { tips: SalesTip[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tips de venta para esta semana</CardTitle>
        <CardDescription>Cruzamos la analítica del sitio con las marcas que ofreces: solo lo que puedes accionar.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {tips.map((tip) => (
            <li key={tip.title} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <Lightbulb className="mt-0.5 size-5 shrink-0" strokeWidth={1.5} aria-hidden />
              <div className="grid gap-0.5">
                <p className="text-small font-semibold">{tip.title}</p>
                <p className="text-muted-foreground text-small">{tip.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
