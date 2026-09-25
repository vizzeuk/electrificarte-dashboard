"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { leadRemaining, type LeadUrgency } from "@/lib/utils";

/** El sistema v1 no tiene color de urgencia: la cercanía del cierre se marca con peso.
 *  Menos de 6 h = chip sólido (Tinta); menos de 24 h = contorno fuerte; resto neutro. */
const VARIANT: Record<LeadUrgency, "default" | "outline" | "secondary"> = {
  critico: "default",
  urgente: "outline",
  normal: "secondary",
  expirado: "secondary",
};

/**
 * Cuenta regresiva viva de la ventana de oferta de un lead. Se refresca cada minuto.
 */
export function LeadTimeRemaining({
  cierraAt,
  className,
}: {
  cierraAt: string | null;
  className?: string;
}) {
  // Arranca en null: server y cliente renderizan lo mismo, sin mismatch de hidratación.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const info = leadRemaining(cierraAt, now ?? undefined);

  if (!info) {
    return <span className="text-muted-foreground text-small">Sin límite</span>;
  }

  return (
    <Badge
      variant={VARIANT[info.urgency]}
      suppressHydrationWarning
      className={[info.urgency === "urgente" ? "border-foreground" : "", "tabular-nums", className].join(" ")}
      title={info.urgency === "expirado" ? "La ventana de oferta cerró" : `Cierra en ${info.label}`}
    >
      <Clock strokeWidth={1.5} aria-hidden />
      {info.urgency === "expirado" ? "Cerrado" : info.label}
    </Badge>
  );
}
