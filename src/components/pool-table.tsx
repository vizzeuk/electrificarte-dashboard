"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OfertarDialog } from "@/components/ofertar-dialog";
import { LeadDetalleDialog } from "@/components/lead-detalle-dialog";
import { LeadTimeRemaining } from "@/components/lead-time-remaining";
import { formatFecha } from "@/lib/utils";
import { financiamientoLabel } from "@/lib/labels";
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
    lead.parte_pago_deuda ? `deuda: ${lead.parte_pago_deuda}` : null,
  ].filter(Boolean);
  return { titulo, sub: extras.join(", ") };
}

/**
 * Pool de leads disponibles, SIN PII del cliente. Cada fila es clickeable y abre el
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
    <div className="overflow-hidden rounded-card border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-muted">
            <TableHead>Busca</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Financiamiento</TableHead>
            <TableHead>Parte de pago</TableHead>
            <TableHead>Cierra en</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-14 text-center">
                No hay leads disponibles por ahora. Cuando entre uno nuevo, aparece acá.
              </TableCell>
            </TableRow>
          )}
          {leads.map((lead) => {
            const partePago = partePagoDetalle(lead);
            const yaOfertado = ofertadosLeadIds.has(lead.id);
            return (
              <TableRow
                key={lead.id}
                onClick={() => setSel(lead)}
                className="cursor-pointer"
              >
                <TableCell>
                  <div className="text-base font-semibold">
                    {lead.target_model || "Sin modelo especificado"}
                  </div>
                  <div className="text-muted-foreground text-micro">
                    Publicado el {formatFecha(lead.created_at)}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {[lead.comuna, lead.region].filter(Boolean).join(", ") || "Sin dato"}
                </TableCell>
                <TableCell className="text-muted-foreground">{financiamientoLabel(lead.financing) ?? "Sin dato"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {partePago ? (
                    <div>
                      <div className="text-foreground font-medium">{partePago.titulo}</div>
                      {partePago.sub && <div className="text-micro">{partePago.sub}</div>}
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
                      <Badge variant="soft">Ya ofertaste</Badge>
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
