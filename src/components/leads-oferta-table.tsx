"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import type { LeadOferta } from "@/lib/mock/types";

export function LeadsOfertaTable({
  leads,
  actionColumn,
}: {
  leads: LeadOferta[];
  actionColumn?: (lead: LeadOferta) => React.ReactNode;
}) {
  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Auto</TableHead>
            <TableHead>Ubicación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            {actionColumn && <TableHead className="text-right">Acción</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={actionColumn ? 6 : 5} className="text-center text-muted-foreground py-8">
                Sin resultados.
              </TableCell>
            </TableRow>
          )}
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <div className="font-medium">{lead.nombre}</div>
                <div className="text-xs text-muted-foreground">{lead.telefono}</div>
              </TableCell>
              <TableCell>
                <div>{lead.auto}</div>
                <div className="text-xs text-muted-foreground">{lead.marca}</div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lead.comuna}, {lead.region}
              </TableCell>
              <TableCell>
                <StatusBadge status={lead.estado} />
              </TableCell>
              <TableCell className="text-muted-foreground">{lead.fecha}</TableCell>
              {actionColumn && <TableCell className="text-right">{actionColumn(lead)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
