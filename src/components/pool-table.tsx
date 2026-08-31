"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OfertarDialog } from "@/components/ofertar-dialog";
import { LeadDetalleDialog } from "@/components/lead-detalle-dialog";
import { LeadTimeRemaining } from "@/components/lead-time-remaining";
import { cn, formatFecha, leadRemaining } from "@/lib/utils";
import type { PoolLead } from "@/lib/db/types";

/** Detalle de la parte de pago que declaró el cliente, en una línea legible. */
function partePagoDetalle(lead: PoolLead): { titulo: string; sub: string } | null {
  const titulo = [lead.parte_pago_marca, lead.parte_pago_modelo, lead.parte_pago_ano]
    .filter(Boolean)
    .join(" ");
  if (!titulo) return null;
  const extras = [
    lead.parte_pago_km ? `${lead.parte_pago_km} km` : null,
    lead.parte_pago_duenos ? `${lead.parte_pago_duenos} dueño(s)` : null,
    lead.parte_pago_deuda ? `Deuda: ${lead.parte_pago_deuda}` : null,
  ].filter(Boolean);
  return { titulo, sub: extras.join(" · ") };
}

/**
 * Pool de leads disponibles — SIN PII del cliente. Cada fila es clickeable y abre el
 * detalle del lead; el botón "Ofertar" queda aparte (no dispara el detalle).
 * La columna "Cierra en" marca la urgencia de la ventana de oferta.
 */
export function PoolTable({
  leads,
  ofertadosLeadIds,
}: {
  leads: PoolLead[];
  ofertadosLeadIds: Set<number>;
}) {
  const [sel, setSel] = useState<PoolLead | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border">
      <Table className="[&_tbody_td]:py-4">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Busca</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Ubicación</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Financiamiento</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Parte de pago</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Cierra en</TableHead>
            <TableHead className="text-right text-xs font-semibold uppercase tracking-wider">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                No hay leads disponibles por ahora.
              </TableCell>
            </TableRow>
          )}
          {leads.map((lead) => {
            const partePago = partePagoDetalle(lead);
            const yaOfertado = ofertadosLeadIds.has(lead.id);
            // Urgencia calculada en server solo para tintar la fila; el conteo vivo lo
            // maneja <LeadTimeRemaining/> en cliente.
            const urgency = leadRemaining(lead.cierra_at)?.urgency;
            return (
              <TableRow
                key={lead.id}
                onClick={() => setSel(lead)}
                className={cn(
                  "cursor-pointer",
                  urgency === "critico"
                    ? "bg-red-50/60 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30"
                    : urgency === "urgente"
                      ? "bg-amber-50/40 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/20"
                      : "hover:bg-muted/50",
                )}
              >
                <TableCell>
                  <div className="font-display text-base font-semibold">
                    {lead.target_model || "Sin modelo especificado"}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Publicado {formatFecha(lead.created_at)}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {[lead.comuna, lead.region].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.financing || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {partePago ? (
                    <div>
                      <div className="text-foreground font-medium">{partePago.titulo}</div>
                      {partePago.sub && <div className="text-xs">{partePago.sub}</div>}
                    </div>
                  ) : (
                    "Sin parte de pago"
                  )}
                </TableCell>
                <TableCell>
                  <LeadTimeRemaining cierraAt={lead.cierra_at} />
                </TableCell>
                <TableCell className="text-right">
                  {/* La acción no debe abrir el detalle de la fila. */}
                  <div
                    className="flex items-center justify-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {yaOfertado ? (
                      <Badge variant="outline" className="text-muted-foreground">Ofertado</Badge>
                    ) : (
                      <OfertarDialog lead={lead} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {sel && (
        <LeadDetalleDialog lead={sel} open={!!sel} onOpenChange={(o) => !o && setSel(null)} />
      )}
    </div>
  );
}
