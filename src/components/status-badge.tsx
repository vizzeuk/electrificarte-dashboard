import { Badge } from "@/components/ui/badge";

type Variant = "default" | "soft" | "secondary" | "outline" | "destructive";

/**
 * Estado de una fila como chip del sistema v1. Sin colores de semáforo: el estado positivo va
 * en Glaciar (suave), lo pendiente en contorno, lo cerrado en Niebla y el error en Alerta.
 */
const ESTADOS: Record<string, { label: string; variant: Variant }> = {
  // pagos y leads
  pendiente: { label: "Pendiente", variant: "outline" },
  "pendiente pago": { label: "Pendiente de pago", variant: "outline" },
  "pendiente de pago": { label: "Pendiente de pago", variant: "outline" },
  pagado: { label: "Pagado", variant: "soft" },
  contactado: { label: "Contactado", variant: "secondary" },
  cerrado: { label: "Cerrado", variant: "secondary" },
  en_conversacion: { label: "En conversación", variant: "outline" },
  // asesorías
  activa: { label: "Activa", variant: "soft" },
  vencida: { label: "Vencida", variant: "secondary" },
  cancelada: { label: "Cancelada", variant: "secondary" },
  // vendedores
  activo: { label: "Activo", variant: "soft" },
  inactivo: { label: "Inactivo", variant: "secondary" },
  nuevo: { label: "Nuevo", variant: "outline" },
  // ofertas
  evaluada: { label: "Evaluada", variant: "outline" },
  ganadora: { label: "Ganadora", variant: "default" },
  aceptada: { label: "Aceptada", variant: "default" },
  perdida: { label: "Perdida", variant: "secondary" },
  rechazada: { label: "Rechazada", variant: "destructive" },
  expirada: { label: "Expirada", variant: "secondary" },
  // reseñas
  aprobada: { label: "Aprobada", variant: "soft" },
};

export function statusLabel(status: string | null | undefined): string {
  const k = (status ?? "").trim().toLowerCase();
  if (!k) return "Sin estado";
  return ESTADOS[k]?.label ?? k.charAt(0).toLocaleUpperCase("es-CL") + k.slice(1);
}

export function StatusBadge({ status, label }: { status: string | null | undefined; label?: string }) {
  const k = (status ?? "").trim().toLowerCase();
  const variant = ESTADOS[k]?.variant ?? "outline";
  return <Badge variant={variant}>{label ?? statusLabel(status)}</Badge>;
}
