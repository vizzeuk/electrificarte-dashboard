import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatCLP, formatFecha } from "@/lib/utils";
import type { Oferta } from "@/lib/db/types";

/**
 * "Mis ofertas" — las pujas propias del vendedor con su estado y score.
 * El estado/score los escribe el backend (n8n) tras evaluar; acá solo se leen.
 */
export function MisOfertasTable({ ofertas }: { ofertas: Oferta[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehículo ofertado</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ofertas.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                Todavía no enviaste ofertas. Andá a “Leads disponibles” para ofertar.
              </TableCell>
            </TableRow>
          )}
          {ofertas.map((o) => {
            const vehiculo = [o.marca_ofertada, o.modelo_ofertado, o.anio_ofertado]
              .filter(Boolean)
              .join(" ");
            return (
              <TableRow key={o.id}>
                <TableCell>
                  <div className="font-medium">{vehiculo || "—"}</div>
                  {o.descalificada && o.motivo_descalificacion && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      Descalificada: {o.motivo_descalificacion}
                    </div>
                  )}
                </TableCell>
                <TableCell>{formatCLP(o.precio_oferta)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {o.horas_entrega != null ? `${o.horas_entrega} h` : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={o.estado ?? "pendiente"} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {o.score_total != null ? Math.round(o.score_total) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatFecha(o.created_at)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
