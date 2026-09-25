"use client";

import { ListChecks } from "lucide-react";
import { DataTable, DetailList, Vacio, type Column, type FilterDef } from "@/components/data-table";
import { MailLink, OutLink, WhatsAppLink } from "@/components/contact-links";
import { Badge } from "@/components/ui/badge";
import type { WaitlistRow } from "@/lib/data/admin-data";
import { fuenteLabel } from "@/lib/labels";
import { autoUrl, formatFecha, formatFechaHora, hace, nombreCompleto } from "@/lib/utils";

const nombre = (r: WaitlistRow) => r.full_name || nombreCompleto(r.first_name, r.last_name);

export function WaitlistTable({ rows, now }: { rows: WaitlistRow[]; now: number }) {
  const fuentes = [...new Set(rows.map((r) => r.source ?? ""))].filter(Boolean).sort();

  const columns: Column<WaitlistRow>[] = [
    {
      id: "nombre",
      header: "Persona",
      primary: true,
      sortValue: (r) => nombre(r)?.toLowerCase() ?? null,
      csv: (r) => nombre(r),
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{nombre(r) ?? <Vacio>Sin nombre</Vacio>}</span>
          {!r.ultima && <Badge variant="secondary">Repetida</Badge>}
        </span>
      ),
    },
    {
      id: "contacto",
      header: "Contacto",
      csvHeader: "Email",
      csv: (r) => r.email,
      cell: (r) => (
        <span className="flex flex-col gap-1">
          <MailLink email={r.email} />
          <WhatsAppLink phone={r.phone} />
        </span>
      ),
    },
    { id: "telefono", header: "Teléfono", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.phone, cell: (r) => r.phone },
    {
      id: "modelo",
      header: "Modelo de interés",
      sortValue: (r) => r.model?.toLowerCase() ?? null,
      csv: (r) => r.model,
      cell: (r) => {
        if (!r.model) return <Vacio>No indicó</Vacio>;
        const url = autoUrl(r.model);
        return url ? <OutLink href={url}>{r.model}</OutLink> : <span className="font-medium">{r.model}</span>;
      },
    },
    {
      id: "origen",
      header: "Origen",
      sortValue: (r) => fuenteLabel(r.source),
      csv: (r) => r.source,
      cell: (r) => <Badge variant="outline">{fuenteLabel(r.source)}</Badge>,
    },
    {
      id: "contactado",
      header: "Contactado",
      sortValue: (r) => (r.contacted ? 1 : 0),
      csv: (r) => (r.contacted ? "Sí" : "No"),
      cell: (r) => (r.contacted ? <Badge variant="soft">Sí</Badge> : <Badge variant="outline">No</Badge>),
    },
    { id: "notas", header: "Notas", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.notes, cell: (r) => r.notes },
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

  const filters: FilterDef<WaitlistRow>[] = [
    {
      id: "unicas",
      label: "Inscripciones",
      allLabel: "Todas las inscripciones",
      options: [{ value: "ultima", label: "Solo una por persona" }],
      get: (r) => (r.ultima ? "ultima" : "repetida"),
    },
    {
      id: "origen",
      label: "Origen",
      allLabel: "Todos los orígenes",
      options: fuentes.map((f) => ({ value: f, label: fuenteLabel(f) })),
      get: (r) => r.source ?? "",
    },
    {
      id: "contactado",
      label: "Contactado",
      allLabel: "Contactados y no",
      options: [
        { value: "no", label: "Sin contactar" },
        { value: "si", label: "Contactados" },
      ],
      get: (r) => (r.contacted ? "si" : "no"),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchText={(r) => [nombre(r), r.email, r.phone, r.model, r.notes].filter(Boolean).join(" ")}
      searchPlaceholder="Buscar nombre, email o modelo"
      filters={filters}
      dateOf={(r) => r.created_at}
      now={now}
      defaultSort={{ id: "fecha", desc: true }}
      csvName="waitlist"
      emptyIcon={ListChecks}
      emptyTitle="Todavía no hay nadie en la waitlist"
      emptyDescription="Cuando alguien deje sus datos en el sitio, aparece acá con su contacto y el modelo que le interesa."
      detailTitle={(r) => nombre(r) ?? "Persona sin nombre"}
      detail={(r) => (
        <div className="flex flex-col gap-6">
          <DetailList
            items={[
              { label: "Email", value: r.email ? <MailLink email={r.email} /> : <Vacio />, full: true },
              { label: "WhatsApp", value: r.phone ? <WhatsAppLink phone={r.phone} /> : <Vacio />, full: true },
              { label: "Modelo de interés", value: r.model ?? <Vacio>No indicó</Vacio> },
              { label: "Origen", value: fuenteLabel(r.source) },
              { label: "Contactado", value: r.contacted ? "Sí" : "No" },
              { label: "Inscripción", value: formatFechaHora(r.created_at) },
              { label: "Notas", value: r.notes ?? <Vacio>Sin notas</Vacio>, full: true },
            ]}
          />
          {!r.ultima && (
            <p className="text-muted-foreground text-small">
              Esta persona se inscribió más de una vez; esta no es su inscripción más reciente.
            </p>
          )}
          <p className="text-muted-foreground border-t pt-4 text-small">
            El panel es de solo lectura: “contactado” y las notas se editan por ahora en Supabase.
          </p>
        </div>
      )}
    />
  );
}
