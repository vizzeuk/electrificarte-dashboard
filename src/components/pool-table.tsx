import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OfertarDialog } from "@/components/ofertar-dialog";
import { formatFecha } from "@/lib/utils";
import type { PoolLead } from "@/lib/db/types";

/**
 * Pool de leads disponibles — SIN PII del cliente. Solo lo necesario para ofertar.
 * El contacto del cliente lo recibe el vendedor ganador por la notificación, no acá.
 */
export function PoolTable({
  leads,
  ofertadosLeadIds,
}: {
  leads: PoolLead[];
  ofertadosLeadIds: Set<number>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Busca</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead>Parte de pago</TableHead>
            <TableHead>Publicado</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                No hay leads disponibles por ahora.
              </TableCell>
            </TableRow>
          )}
          {leads.map((lead) => {
            const partePago = [lead.parte_pago_marca, lead.parte_pago_modelo]
              .filter(Boolean)
              .join(" ");
            const yaOfertado = ofertadosLeadIds.has(lead.id);
            return (
              <TableRow key={lead.id}>
                <TableCell>
                  <div className="font-medium">{lead.target_model || "—"}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {[lead.comuna, lead.region].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.financing || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {partePago ? (
                    <span>
                      {partePago}
                      {lead.parte_pago_ano ? ` · ${lead.parte_pago_ano}` : ""}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatFecha(lead.created_at)}</TableCell>
                <TableCell className="text-right">
                  {yaOfertado ? (
                    <Badge variant="outline" className="text-muted-foreground">Ofertado</Badge>
                  ) : (
                    <OfertarDialog lead={lead} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
