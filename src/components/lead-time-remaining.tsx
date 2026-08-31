"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import { cn, leadRemaining, type LeadUrgency } from "@/lib/utils";

/** Tratamiento por urgencia — reusa la misma paleta ámbar/rojo/slate que el resto del panel. */
const STYLES: Record<LeadUrgency, string> = {
  critico:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400",
  urgente:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400",
  normal:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400",
  expirado:
    "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500",
};

/**
 * Cuenta regresiva viva de la ventana de oferta de un lead. Se refresca cada minuto y
 * cambia de color a medida que se acerca el cierre, para que "queda poco" se vea, no se lea.
 */
export function LeadTimeRemaining({
  cierraAt,
  className,
}: {
  cierraAt: string | null;
  className?: string;
}) {
  // Arranca en null: server y cliente renderizan el mismo placeholder, sin mismatch de
  // hidratación. Tras montar, el intervalo lo mantiene al minuto.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const info = leadRemaining(cierraAt, now ?? undefined);

  if (!info) {
    return (
      <span className={cn("text-muted-foreground text-sm tabular-nums", className)}>
        Sin límite
      </span>
    );
  }

  const Icon = info.urgency === "critico" ? AlertTriangle : Clock;

  return (
    <span
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium tabular-nums",
        STYLES[info.urgency],
        info.urgency === "critico" && "animate-pulse",
        className,
      )}
      title={info.urgency === "expirado" ? "La ventana de oferta cerró" : `Cierra en ${info.label}`}
    >
      <Icon className="size-3.5" />
      {info.urgency === "expirado" ? "Cerrado" : info.label}
    </span>
  );
}
