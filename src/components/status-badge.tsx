import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AMBER = "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400";
const BLUE = "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400";
const VIOLET = "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-400";
const EMERALD = "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400";
const RED = "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400";
const SLATE = "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400";

const LABELS: Record<string, string> = {
  // leads (mock legacy)
  pendiente: "Pendiente",
  pagado: "Pagado",
  contactado: "Contactado",
  cerrado: "Cerrado",
  en_conversacion: "En conversación",
  // ofertas (estados reales)
  evaluada: "Evaluada",
  ganadora: "Ganadora",
  perdida: "Perdida",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  expirada: "Expirada",
};

const CLASSES: Record<string, string> = {
  pendiente: AMBER,
  pagado: BLUE,
  contactado: VIOLET,
  cerrado: EMERALD,
  en_conversacion: VIOLET,
  evaluada: BLUE,
  ganadora: EMERALD,
  aceptada: EMERALD,
  perdida: SLATE,
  rechazada: RED,
  expirada: SLATE,
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", CLASSES[status])}>
      {LABELS[status] ?? status}
    </Badge>
  );
}
