import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Vendedor } from "@/lib/mock/types";

export function VendedoresTable({ vendedores }: { vendedores: Vendedor[] }) {
  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendedor</TableHead>
            <TableHead>Región</TableHead>
            <TableHead>Leads ofertados</TableHead>
            <TableHead>Leads ganados</TableHead>
            <TableHead>Tasa de respuesta</TableHead>
            <TableHead>Última actividad</TableHead>
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendedores.map((v) => (
            <TableRow key={v.id}>
              <TableCell>
                <div className="font-medium">{v.nombre}</div>
                <div className="text-xs text-muted-foreground">{v.contacto}</div>
              </TableCell>
              <TableCell className="text-muted-foreground">{v.region}</TableCell>
              <TableCell className="tabular-nums">{v.leadsOfertados}</TableCell>
              <TableCell className="tabular-nums">{v.leadsGanados}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2 w-32">
                  <Progress value={v.tasaRespuesta} className="h-1.5" />
                  <span className="text-xs text-muted-foreground tabular-nums w-9">{v.tasaRespuesta}%</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{v.ultimaActividad}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    v.activo
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }
                >
                  {v.activo ? "Activo" : "Inactivo"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
