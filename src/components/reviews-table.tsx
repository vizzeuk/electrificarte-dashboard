import { ExternalLink, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFecha } from "@/lib/utils";
import type { ReviewRow } from "@/lib/data/reviews-data";

const SITE = "https://www.electrificarte.com";

function Estado({ r }: { r: ReviewRow }) {
  if (r.status === "pendiente") return <Badge variant="outline">Por moderar</Badge>;
  if (r.status === "rechazada") return <Badge variant="destructive">Rechazada</Badge>;
  if (r.auto) return <Badge variant="secondary">Publicada sola (sin fotos)</Badge>;
  return <Badge>Aprobada</Badge>;
}

/**
 * Lista de solo lectura con todas las reseñas. Sin acciones: solo las reseñas con fotos se
 * aprueban o rechazan, y eso se hace en la cola de arriba (ReviewsModeration).
 */
export function ReviewsTable({ reviews }: { reviews: ReviewRow[] }) {
  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">Todavía no llegan reseñas.</CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Auto</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead className="w-[40%]">Reseña</TableHead>
              <TableHead>Fotos</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap tabular-nums">{formatFecha(r.created_at)}</TableCell>
                <TableCell>
                  {r.car_slug ? (
                    <a href={`${SITE}/auto/${r.car_slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                      {[r.car_brand, r.car_model].filter(Boolean).join(" ") || r.car_slug}
                      <ExternalLink className="size-3.5" strokeWidth={1.5} />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Sin auto</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap tabular-nums">
                  <span className="inline-flex items-center gap-1"><Star className="size-3.5" strokeWidth={1.5} />{r.rating ?? "—"}</span>
                </TableCell>
                <TableCell className="whitespace-nowrap">{[r.first_name, r.last_name?.[0] ? `${r.last_name[0]}.` : ""].filter(Boolean).join(" ")}</TableCell>
                <TableCell className="max-w-0"><p className="truncate" title={r.body ?? ""}>{r.body}</p></TableCell>
                <TableCell className="tabular-nums">{r.fotos}</TableCell>
                <TableCell><Estado r={r} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
