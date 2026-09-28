"use client";

import { Store } from "lucide-react";
import { DataTable, DetailList, Vacio, type Column, type FilterDef } from "@/components/data-table";
import { MailLink, WhatsAppLink } from "@/components/contact-links";
import { Badge } from "@/components/ui/badge";
import type { WaitlistVendedorRow } from "@/lib/data/admin-data";
import { fuenteLabel } from "@/lib/labels";
import { parseMarcas } from "@/lib/marcas";
import type { PeriodoInfo } from "@/lib/periodo";
import { formatFecha, formatFechaHora, hace, nombreCompleto } from "@/lib/utils";

const nombre = (r: WaitlistVendedorRow) => nombreCompleto(r.first_name, r.last_name);
const ubicacion = (r: WaitlistVendedorRow) => [r.comuna, r.region].map((x) => x?.trim()).filter(Boolean).join(", ");

function Marcas({ marcas }: { marcas: string | null }) {
  const lista = parseMarcas(marcas);
  if (lista.length === 0) return <Vacio>Sin marcas</Vacio>;
  return (
    <span className="flex flex-wrap gap-1">
      {lista.map((m) => (
        <Badge key={m} variant="outline">
          {m}
        </Badge>
      ))}
    </span>
  );
}

export function WaitlistVendedoresTable({ rows, now, periodo }: { rows: WaitlistVendedorRow[]; now: number; periodo?: PeriodoInfo }) {
  const regiones = [...new Set(rows.map((r) => r.region?.trim() ?? ""))].filter(Boolean).sort((a, b) => a.localeCompare(b, "es"));
  const marcas = [...new Set(rows.flatMap((r) => parseMarcas(r.marcas)))].sort((a, b) => a.localeCompare(b, "es"));
  const fuentes = [...new Set(rows.map((r) => r.source ?? ""))].filter(Boolean).sort();

  const columns: Column<WaitlistVendedorRow>[] = [
    {
      id: "nombre",
      header: "Vendedor",
      primary: true,
      sortValue: (r) => nombre(r)?.toLowerCase() ?? null,
      csv: (r) => nombre(r),
      cell: (r) => (
        <span className="flex flex-col">
          <span className="font-semibold">{nombre(r) ?? <Vacio>Sin nombre</Vacio>}</span>
          {r.punto_venta && <span className="text-muted-foreground text-micro">{r.punto_venta}</span>}
        </span>
      ),
    },
    { id: "punto", header: "Punto de venta", hideOnDesktop: true, csv: (r) => r.punto_venta, cell: (r) => r.punto_venta ?? <Vacio /> },
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
    { id: "zona", header: "Zona", sortValue: (r) => ubicacion(r) || null, csv: (r) => ubicacion(r), cell: (r) => ubicacion(r) || <Vacio /> },
    { id: "marcas", header: "Marcas", className: "whitespace-normal", csv: (r) => r.marcas, cell: (r) => <Marcas marcas={r.marcas} /> },
    {
      id: "contactado",
      header: "Contactado",
      sortValue: (r) => (r.contacted ? 1 : 0),
      csv: (r) => (r.contacted ? "Sí" : "No"),
      cell: (r) => (r.contacted ? <Badge variant="soft">Sí</Badge> : <Badge variant="outline">No</Badge>),
    },
    { id: "mensaje", header: "Mensaje", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.mensaje, cell: (r) => r.mensaje },
    { id: "origen", header: "Origen", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.source, cell: (r) => fuenteLabel(r.source) },
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

  const filters: FilterDef<WaitlistVendedorRow>[] = [
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
    { id: "region", label: "Región", allLabel: "Todas las regiones", options: regiones.map((x) => ({ value: x, label: x })), get: (r) => r.region?.trim() ?? "" },
    {
      id: "marca",
      label: "Marca",
      allLabel: "Todas las marcas",
      options: marcas.map((m) => ({ value: m, label: m })),
      match: (r, marca) => parseMarcas(r.marcas).includes(marca),
    },
    ...(fuentes.length > 1
      ? [{ id: "origen", label: "Origen", allLabel: "Todos los orígenes", options: fuentes.map((f) => ({ value: f, label: fuenteLabel(f) })), get: (r: WaitlistVendedorRow) => r.source ?? "" }]
      : []),
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchText={(r) => [nombre(r), r.punto_venta, r.email, r.phone, r.comuna, r.region, r.marcas, r.mensaje, r.notes].filter(Boolean).join(" ")}
      searchPlaceholder="Buscar nombre, email, marca o comuna"
      filters={filters}
      dateOf={(r) => r.created_at}
      now={now}
      periodo={periodo}
      defaultSort={{ id: "fecha", desc: true }}
      csvName="waitlist-vendedores"
      emptyIcon={Store}
      emptyTitle="Todavía no hay vendedores en la lista"
      emptyDescription="Cuando alguien que vende autos electrificados deje sus datos en el sitio, aparece acá."
      detailTitle={(r) => nombre(r) ?? "Vendedor sin nombre"}
      detail={(r) => (
        <div className="flex flex-col gap-6">
          <DetailList
            items={[
              { label: "Punto de venta", value: r.punto_venta ?? <Vacio />, full: true },
              { label: "Email", value: r.email ? <MailLink email={r.email} /> : <Vacio />, full: true },
              { label: "WhatsApp", value: r.phone ? <WhatsAppLink phone={r.phone} /> : <Vacio />, full: true },
              { label: "Comuna", value: r.comuna ?? <Vacio /> },
              { label: "Región", value: r.region ?? <Vacio /> },
              { label: "Marcas", value: <Marcas marcas={r.marcas} />, full: true },
              { label: "Mensaje", value: r.mensaje ?? <Vacio>Sin mensaje</Vacio>, full: true },
              { label: "Origen", value: fuenteLabel(r.source) },
              { label: "Contactado", value: r.contacted ? "Sí" : "No" },
              { label: "Inscripción", value: formatFechaHora(r.created_at), full: true },
              { label: "Notas", value: r.notes ?? <Vacio>Sin notas</Vacio>, full: true },
            ]}
          />
          <p className="text-muted-foreground border-t pt-4 text-small">
            El panel es de solo lectura: “contactado” y las notas se editan por ahora en Supabase.
          </p>
        </div>
      )}
    />
  );
}
