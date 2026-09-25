"use client";

import { Star } from "lucide-react";
import { DataTable, DetailList, Vacio, type Column, type FilterDef } from "@/components/data-table";
import { OutLink } from "@/components/contact-links";
import { Estrellas } from "@/components/estrellas";
import { Badge } from "@/components/ui/badge";
import { formatFecha, formatFechaHora, formatNumero, SITIO } from "@/lib/utils";
import type { ReviewRow } from "@/lib/data/reviews-data";

type EstadoKey = "pendiente" | "rechazada" | "auto" | "aprobada";

function estadoDe(r: ReviewRow): EstadoKey {
  if (r.status === "pendiente") return "pendiente";
  if (r.status === "rechazada") return "rechazada";
  if (r.auto) return "auto";
  return "aprobada";
}

const ESTADO: Record<EstadoKey, { label: string; variant: "outline" | "destructive" | "secondary" | "soft" }> = {
  pendiente: { label: "Por moderar", variant: "outline" },
  rechazada: { label: "Rechazada", variant: "destructive" },
  auto: { label: "Publicada sola", variant: "secondary" },
  aprobada: { label: "Aprobada", variant: "soft" },
};

const autor = (r: ReviewRow) => [r.first_name, r.last_name?.[0] ? `${r.last_name[0]}.` : ""].filter(Boolean).join(" ");
const auto = (r: ReviewRow) => [r.car_brand, r.car_model].filter(Boolean).join(" ") || r.car_slug || null;

function Auto({ r }: { r: ReviewRow }) {
  const nombre = auto(r);
  if (!nombre) return <Vacio>Sin auto</Vacio>;
  return r.car_slug ? <OutLink href={`${SITIO}/auto/${r.car_slug}`}>{nombre}</OutLink> : <span>{nombre}</span>;
}

/**
 * Lista de solo lectura con todas las reseñas. Sin acciones: solo las reseñas con fotos se
 * aprueban o rechazan, y eso se hace en la cola de arriba (ReviewsModeration).
 */
export function ReviewsTable({ reviews, now }: { reviews: ReviewRow[]; now: number }) {
  const columns: Column<ReviewRow>[] = [
    {
      id: "auto",
      header: "Auto",
      primary: true,
      sortValue: (r) => auto(r)?.toLowerCase() ?? null,
      csv: (r) => auto(r),
      cell: (r) => <Auto r={r} />,
    },
    {
      id: "nota",
      header: "Nota",
      sortValue: (r) => r.rating,
      csv: (r) => r.rating,
      cell: (r) => <Estrellas n={r.rating} />,
    },
    { id: "autor", header: "Autor", sortValue: (r) => autor(r).toLowerCase() || null, csv: (r) => autor(r), cell: (r) => autor(r) || <Vacio>Anónimo</Vacio> },
    {
      id: "texto",
      header: "Reseña",
      className: "w-full max-w-0",
      csv: (r) => r.body,
      cell: (r) => <p className="truncate" title={r.body ?? ""}>{r.body || <Vacio>Sin texto</Vacio>}</p>,
    },
    { id: "fotos", header: "Fotos", sortValue: (r) => r.fotos, csv: (r) => r.fotos, cell: (r) => <span className="tabular-nums">{formatNumero(r.fotos)}</span> },
    {
      id: "estado",
      header: "Estado",
      sortValue: (r) => ESTADO[estadoDe(r)].label,
      csv: (r) => ESTADO[estadoDe(r)].label,
      cell: (r) => <Badge variant={ESTADO[estadoDe(r)].variant}>{ESTADO[estadoDe(r)].label}</Badge>,
    },
    {
      id: "fecha",
      header: "Fecha",
      sortValue: (r) => (r.created_at ? new Date(r.created_at).getTime() : null),
      csv: (r) => formatFechaHora(r.created_at),
      cell: (r) => <span className="tabular-nums">{formatFecha(r.created_at)}</span>,
    },
  ];

  const filters: FilterDef<ReviewRow>[] = [
    {
      id: "estado",
      label: "Estado",
      allLabel: "Todos los estados",
      options: (Object.keys(ESTADO) as EstadoKey[])
        .filter((k) => reviews.some((r) => estadoDe(r) === k))
        .map((k) => ({ value: k, label: ESTADO[k].label })),
      get: (r) => estadoDe(r),
    },
    {
      id: "fotos",
      label: "Fotos",
      allLabel: "Con y sin fotos",
      options: [
        { value: "si", label: "Con fotos" },
        { value: "no", label: "Sin fotos" },
      ],
      get: (r) => (r.fotos > 0 ? "si" : "no"),
    },
  ];

  return (
    <DataTable
      rows={reviews}
      columns={columns}
      getRowId={(r) => r.id}
      searchText={(r) => [auto(r), r.first_name, r.last_name, r.body].filter(Boolean).join(" ")}
      searchPlaceholder="Buscar por auto, autor o texto"
      filters={filters}
      dateOf={(r) => r.created_at}
      now={now}
      defaultSort={{ id: "fecha", desc: true }}
      csvName="resenas"
      emptyIcon={Star}
      emptyTitle="Todavía no llegan reseñas"
      emptyDescription="Las reseñas que dejan las personas en las fichas de autos aparecen acá."
      detailTitle={(r) => auto(r) ?? "Reseña"}
      detail={(r) => (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Estrellas n={r.rating} className="[&_svg]:size-5" />
            <span className="text-muted-foreground text-small">{r.rating ?? 0} de 5</span>
          </div>
          <p className="text-base leading-relaxed whitespace-pre-wrap">{r.body || <Vacio>Sin texto</Vacio>}</p>
          <DetailList
            items={[
              { label: "Autor", value: autor(r) || <Vacio>Anónimo</Vacio> },
              { label: "Fotos", value: formatNumero(r.fotos) },
              { label: "Estado", value: <Badge variant={ESTADO[estadoDe(r)].variant}>{ESTADO[estadoDe(r)].label}</Badge> },
              { label: "Fecha", value: formatFechaHora(r.created_at) },
              { label: "Moderada por", value: r.moderated_by ?? <Vacio>{r.auto ? "Publicada sin moderar" : "Nadie todavía"}</Vacio>, full: true },
              { label: "Auto", value: <Auto r={r} />, full: true },
            ]}
          />
        </div>
      )}
    />
  );
}
