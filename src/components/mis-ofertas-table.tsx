"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { OfertaDetalleDialog } from "@/components/oferta-detalle-dialog";
import { formatCLP, formatFecha } from "@/lib/utils";
import type { Oferta } from "@/lib/db/types";

/**
 * "Mis ofertas": las pujas propias del vendedor con su estado y score. Cada fila es
 * clickeable y abre el detalle completo de la puja.
 */
export function MisOfertasTable({ ofertas }: { ofertas: Oferta[] }) {
  const [sel, setSel] = useState<Oferta | null>(null);

  return (
    <div className="overflow-hidden rounded-card border">
      <Table>
        <TableHeader className="bg-muted">
          <TableRow className="hover:bg-muted">
            <TableHead>Vehículo ofertado</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Entrega</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Puntaje</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ofertas.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-14 text-center">
                Todavía no envías ofertas. Ve a “Leads disponibles” para ofertar.
              </TableCell>
            </TableRow>
          )}
          {ofertas.map((o) => {
            const vehiculo = [o.marca_ofertada, o.modelo_ofertado, o.anio_ofertado]
              .filter(Boolean)
              .join(" ");
            return (
              <TableRow
                key={o.id}
                onClick={() => setSel(o)}
                className="cursor-pointer"
              >
                <TableCell>
                  <div className="text-base font-semibold">{vehiculo || "Sin dato"}</div>
                  {o.descalificada && o.motivo_descalificacion && (
                    <div className="text-destructive text-micro">
                      Descalificada: {o.motivo_descalificacion}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium tabular-nums">{formatCLP(o.precio_oferta)}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {o.horas_entrega != null ? `${o.horas_entrega} h` : "Sin dato"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={o.estado ?? "pendiente"} />
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {o.score_total != null ? Math.round(o.score_total) : "Sin evaluar"}
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{formatFecha(o.created_at)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {sel && (
        <OfertaDetalleDialog oferta={sel} open={!!sel} onOpenChange={(o) => !o && setSel(null)} />
      )}
    </div>
  );
}
