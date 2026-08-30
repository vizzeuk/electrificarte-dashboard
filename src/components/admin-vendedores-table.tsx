import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AdminVendedor } from "@/lib/data/admin-data";

const ACTIVO = "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400";
const OTRO = "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400";

export function AdminVendedoresTable({ vendedores }: { vendedores: AdminVendedor[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <Table className="[&_tbody_td]:py-4">
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Vendedor</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Región</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Marcas</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Ofertas</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Ganadas</TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-wider">Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendedores.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-muted-foreground py-12 text-center">
                Todavía no hay vendedores registrados.
              </TableCell>
            </TableRow>
          )}
          {vendedores.map((v) => {
            const nombre =
              v.nombre_concesionario ||
              [v.nombre, v.apellido].filter(Boolean).join(" ") ||
              v.email ||
              "—";
            const activo = (v.estado ?? "").toLowerCase() === "activo";
            return (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="font-medium">{nombre}</div>
                  <div className="text-muted-foreground text-xs">{v.email || "—"}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {[v.comuna, v.region].filter(Boolean).join(", ") || v.region || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{v.marcas || "—"}</TableCell>
                <TableCell className="tabular-nums">{v.ofertas}</TableCell>
                <TableCell className="tabular-nums">{v.ganadas}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("font-medium capitalize", activo ? ACTIVO : OTRO)}>
                    {v.estado || "—"}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
