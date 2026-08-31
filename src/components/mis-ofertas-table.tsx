"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { OfertaDetalleDialog } from "@/components/oferta-detalle-dialog";
import { formatCLP, formatFecha } from "@/lib/utils";
import type { Oferta } from "@/lib/db/types";

/**
 * "Mis ofertas" — las pujas propias del vendedor con su estado y score. Cada fila es
 * clickeable y abre el detalle completo de la puja.
 */
export function MisOfertasTable({ ofertas }: { ofertas: Oferta[] }) {
  const [sel, setSel] = useState<Oferta | null>(null);

  return (
    <div className="overflow-x-auto rounded-2xl border">
      <Table className="[&_tbody_td]:py-4">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Vehículo ofertado</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Precio</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Entrega</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Estado</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Score</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ofertas.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                Todavía no enviaste ofertas. Andá a “Leads disponibles” para ofertar.
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
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>
                  <div className="font-display text-base font-semibold">{vehiculo || "—"}</div>
                  {o.descalificada && o.motivo_descalificacion && (
                    <div className="text-xs text-red-600 dark:text-red-400">
                      Descalificada: {o.motivo_descalificacion}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium tabular-nums">{formatCLP(o.precio_oferta)}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {o.horas_entrega != null ? `${o.horas_entrega} h` : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={o.estado ?? "pendiente"} />
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">
                  {o.score_total != null ? Math.round(o.score_total) : "—"}
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
