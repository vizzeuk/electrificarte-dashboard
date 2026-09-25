"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LeadTimeRemaining } from "@/components/lead-time-remaining";
import { formatFecha } from "@/lib/utils";
import { financiamientoLabel } from "@/lib/labels";
import type { PoolLead } from "@/lib/db/types";

export function LeadDetalleDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: PoolLead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const ubicacion = [lead.comuna, lead.region].filter(Boolean).join(", ") || "Sin dato";
  const partePago =
    [lead.parte_pago_marca, lead.parte_pago_modelo, lead.parte_pago_ano].filter(Boolean).join(" ") || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {lead.target_model || "Sin modelo especificado"}
          </DialogTitle>
          <DialogDescription>Lead disponible, publicado el {formatFecha(lead.created_at)}</DialogDescription>
        </DialogHeader>

        <div>
          <LeadTimeRemaining cierraAt={lead.cierra_at} />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Dato label="Ubicación" value={ubicacion} />
          <Dato label="Financiamiento" value={financiamientoLabel(lead.financing) ?? "Sin dato"} />
        </dl>

        <div className="bg-muted rounded-card p-4">
          <p className="text-muted-foreground text-label">Parte de pago que declaró el cliente</p>
          {partePago ? (
            <>
              <p className="mt-1 text-base font-semibold">{partePago}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                <Dato label="Kilometraje" value={lead.parte_pago_km ? `${lead.parte_pago_km} km` : "Sin dato"} />
                <Dato label="Dueños" value={lead.parte_pago_duenos || "Sin dato"} />
                <Dato label="Deuda" value={lead.parte_pago_deuda || "Sin dato"} />
              </dl>
            </>
          ) : (
            <p className="mt-1 text-small">Sin parte de pago</p>
          )}
        </div>

        <p className="text-muted-foreground text-small">
          El contacto del cliente no se muestra acá: lo recibe por WhatsApp el vendedor cuya oferta sea
          seleccionada.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-muted-foreground text-label">{label}</dt>
      <dd className="text-small font-medium">{value}</dd>
    </div>
  );
}
