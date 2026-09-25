import { ArrowDown, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

/** Variación % (KPIs, ranking de tendencia). Sube = chip suave; baja = contorno. */
export function TrendBadge({ pct, className }: { pct: number; className?: string }) {
  const positive = pct >= 0;
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <Badge variant={positive ? "soft" : "outline"} className={className}>
      <Icon strokeWidth={2} />
      <span className="tabular-nums">{Math.abs(pct).toLocaleString("es-CL")}%</span>
    </Badge>
  );
}
