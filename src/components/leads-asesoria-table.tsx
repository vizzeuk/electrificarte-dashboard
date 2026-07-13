import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import type { LeadAsesoria } from "@/lib/mock/types";

export function LeadsAsesoriaTable({ leads }: { leads: LeadAsesoria[] }) {
  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead>Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.nombre}</TableCell>
              <TableCell className="text-muted-foreground">
                <div>{lead.email}</div>
                <div className="text-xs">{lead.telefono}</div>
              </TableCell>
              <TableCell>
                <StatusBadge status={lead.estado} />
              </TableCell>
              <TableCell className="text-muted-foreground max-w-xs">{lead.interes}</TableCell>
              <TableCell className="text-muted-foreground">{lead.fecha}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
