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
  const ubicacion = [lead.comuna, lead.region].filter(Boolean).join(", ") || "—";
  const partePago =
    [lead.parte_pago_marca, lead.parte_pago_modelo, lead.parte_pago_ano].filter(Boolean).join(" ") || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {lead.target_model || "Sin modelo especificado"}
          </DialogTitle>
          <DialogDescription>Lead disponible · publicado {formatFecha(lead.created_at)}</DialogDescription>
        </DialogHeader>

        <div>
          <LeadTimeRemaining cierraAt={lead.cierra_at} />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Dato label="Ubicación" value={ubicacion} />
          <Dato label="Financiamiento" value={lead.financing || "—"} />
        </dl>

        <div className="rounded-lg border bg-muted/40 p-3">
          <p className="text-muted-foreground text-xs">Parte de pago que declaró el cliente</p>
          {partePago ? (
            <>
              <p className="text-base font-semibold">{partePago}</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                <Dato label="Kilometraje" value={lead.parte_pago_km ? `${lead.parte_pago_km} km` : "—"} />
                <Dato label="Dueños" value={lead.parte_pago_duenos || "—"} />
                <Dato label="Deuda" value={lead.parte_pago_deuda || "—"} />
              </dl>
            </>
          ) : (
            <p className="text-sm">Sin parte de pago</p>
          )}
        </div>

        <p className="text-muted-foreground text-xs">
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
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}
