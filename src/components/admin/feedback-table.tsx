"use client";

import { MessageSquareText } from "lucide-react";
import { Estrellas } from "@/components/estrellas";
import { DataTable, Vacio, type Column, type FilterDef } from "@/components/data-table";
import type { RatingRow } from "@/lib/data/admin-data";
import { formatFecha, formatFechaHora, hace } from "@/lib/utils";

export function FeedbackTable({ rows, now }: { rows: RatingRow[]; now: number }) {
  const columns: Column<RatingRow>[] = [
    {
      id: "nota",
      header: "Nota",
      primary: true,
      sortValue: (r) => r.stars,
      csv: (r) => r.stars,
      cell: (r) => (
        <span className="inline-flex items-center gap-2">
          <Estrellas n={r.stars} />
          <span className="tabular-nums">{r.stars?.toLocaleString("es-CL") ?? "Sin nota"}</span>
        </span>
      ),
    },
    {
      id: "comentario",
      header: "Comentario",
      className: "w-full whitespace-normal",
      csv: (r) => r.feedback,
      cell: (r) => (r.feedback?.trim() ? <p className="max-w-prose">{r.feedback}</p> : <Vacio>Sin comentario</Vacio>),
    },
    {
      id: "fecha",
      header: "Fecha",
      sortValue: (r) => (r.created_at ? new Date(r.created_at).getTime() : null),
      csv: (r) => formatFechaHora(r.created_at),
      cell: (r) => (
        <span className="flex flex-col tabular-nums">
          <span>{formatFecha(r.created_at)}</span>
          <span className="text-muted-foreground text-micro">{hace(r.created_at, now)}</span>
        </span>
      ),
    },
  ];

  const filters: FilterDef<RatingRow>[] = [
    {
      id: "nota",
      label: "Nota",
      allLabel: "Todas las notas",
      options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} ${n === 1 ? "estrella" : "estrellas"}` })),
      get: (r) => String(Math.round(r.stars ?? 0)),
    },
    {
      id: "comentario",
      label: "Comentario",
      allLabel: "Con y sin comentario",
      options: [{ value: "si", label: "Solo con comentario" }],
      get: (r) => (r.feedback?.trim() ? "si" : "no"),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchText={(r) => r.feedback ?? ""}
      searchPlaceholder="Buscar en los comentarios"
      filters={filters}
      dateOf={(r) => r.created_at}
      now={now}
      defaultSort={{ id: "fecha", desc: true }}
      csvName="feedback-sitio"
      emptyIcon={MessageSquareText}
      emptyTitle="Todavía no hay calificaciones"
      emptyDescription="Cuando alguien califique el sitio con el botón “Tu opinión”, aparece acá."
    />
  );
}
