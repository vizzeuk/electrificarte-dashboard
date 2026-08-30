import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatFecha } from "@/lib/utils";
import type { AdminLead } from "@/lib/data/admin-data";

/** Tabla de leads de oferta para el admin — datos completos (incluye contacto). */
export function AdminLeadsTable({ leads }: { leads: AdminLead[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <Table className="[&_tbody_td]:py-4">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Cliente</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Busca</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Ubicación</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Pago</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Estado</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Fecha</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                No hay leads pagados por ahora.
              </TableCell>
            </TableRow>
          )}
          {leads.map((l) => {
            const nombre = [l.first_name, l.last_name].filter(Boolean).join(" ") || "—";
            return (
              <TableRow key={l.id}>
                <TableCell>
                  <div className="font-medium">{nombre}</div>
                  <div className="text-muted-foreground text-xs">{l.telefono || l.email || "—"}</div>
                </TableCell>
                <TableCell className="font-display font-semibold">{l.target_model || "—"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {[l.comuna, l.region].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{l.financing || "—"}</TableCell>
                <TableCell>
                  <StatusBadge status={l.status ?? "pagado"} />
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{formatFecha(l.created_at)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
