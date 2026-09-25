"use client";

import { Mail } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { MailLink } from "@/components/contact-links";
import type { NewsletterRow } from "@/lib/data/admin-data";
import { formatFecha, formatFechaHora, hace } from "@/lib/utils";

export function NewsletterTable({ rows, now }: { rows: NewsletterRow[]; now: number }) {
  const columns: Column<NewsletterRow>[] = [
    {
      id: "email",
      header: "Email",
      primary: true,
      sortValue: (r) => r.email?.toLowerCase() ?? null,
      csv: (r) => r.email,
      cell: (r) => <MailLink email={r.email} />,
    },
    {
      id: "fecha",
      header: "Suscripción",
      sortValue: (r) => (r.created_at ? new Date(r.created_at).getTime() : null),
      csv: (r) => formatFechaHora(r.created_at),
      cell: (r) => (
        <span className="tabular-nums">
          {formatFecha(r.created_at)} <span className="text-muted-foreground">({hace(r.created_at, now)})</span>
        </span>
      ),
    },
  ];
  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchText={(r) => r.email ?? ""}
      searchPlaceholder="Buscar por email"
      dateOf={(r) => r.created_at}
      now={now}
      defaultSort={{ id: "fecha", desc: true }}
      csvName="newsletter"
      emptyIcon={Mail}
      emptyTitle="Todavía no hay suscripciones"
      emptyDescription="Los correos que se suscriben desde el sitio aparecen acá."
    />
  );
}
