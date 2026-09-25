"use client";

import { Sparkles } from "lucide-react";
import { DataTable, DetailList, Vacio, type Column, type FilterDef } from "@/components/data-table";
import { MailLink, WhatsAppLink } from "@/components/contact-links";
import { StatusBadge } from "@/components/status-badge";
import type { AsesoriaRow } from "@/lib/data/admin-data";
import { formatFecha, formatFechaHora, hace } from "@/lib/utils";

const ESTADOS = [
  { value: "activa", label: "Activas" },
  { value: "vencida", label: "Vencidas" },
  { value: "pendiente de pago", label: "Pago pendiente" },
  { value: "cancelada", label: "Canceladas" },
];

function Vigencia({ r }: { r: AsesoriaRow }) {
  if (r.estado === "activa") {
    return (
      <span className="tabular-nums">
        <span className="font-semibold">{r.dias_restantes}</span>{" "}
        {r.dias_restantes === 1 ? "día" : "días"}
        <span className="text-muted-foreground block text-micro">vence el {formatFecha(r.vence)}</span>
      </span>
    );
  }
  if (r.estado === "vencida") return <Vacio>Venció el {formatFecha(r.vence)}</Vacio>;
  return <Vacio>No aplica</Vacio>;
}

export function AsesoriasTable({ rows, now }: { rows: AsesoriaRow[]; now: number }) {
  const columns: Column<AsesoriaRow>[] = [
    {
      id: "nombre",
      header: "Persona",
      primary: true,
      sortValue: (r) => r.fullname?.toLowerCase() ?? null,
      csv: (r) => r.fullname,
      cell: (r) => <span className="font-semibold">{r.fullname ?? <Vacio>Sin nombre</Vacio>}</span>,
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
      id: "estado",
      header: "Estado",
      sortValue: (r) => r.estado,
      csv: (r) => r.estado,
      cell: (r) => <StatusBadge status={r.estado} label={r.estado === "pendiente de pago" ? "Pago pendiente" : undefined} />,
    },
    {
      id: "vigencia",
      header: "Días restantes",
      sortValue: (r) => (r.estado === "activa" ? r.dias_restantes : null),
      csv: (r) => (r.estado === "activa" ? r.dias_restantes : 0),
      cell: (r) => <Vigencia r={r} />,
    },
    {
      id: "pago",
      header: "Pagó",
      sortValue: (r) => (r.paid_at ? new Date(r.paid_at).getTime() : null),
      csv: (r) => (r.paid_at ? formatFechaHora(r.paid_at) : ""),
      cell: (r) => (r.paid_at ? <span className="tabular-nums">{formatFecha(r.paid_at)}</span> : <Vacio>Sin pago</Vacio>),
    },
    {
      id: "fecha",
      header: "Formulario",
      sortValue: (r) => (r.created_at ? new Date(r.created_at).getTime() : null),
      csv: (r) => formatFechaHora(r.created_at),
      cell: (r) => (
        <span className="flex flex-col tabular-nums">
          <span>{formatFecha(r.created_at)}</span>
          <span className="text-muted-foreground text-micro">{hace(r.created_at, now)}</span>
        </span>
      ),
    },
    { id: "orden", header: "Orden", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.order_id, cell: (r) => r.order_id },
  ];

  const filters: FilterDef<AsesoriaRow>[] = [
    {
      id: "estado",
      label: "Estado",
      allLabel: "Todos los estados",
      options: ESTADOS.filter((e) => rows.some((r) => r.estado === e.value)),
      get: (r) => r.estado,
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchText={(r) => [r.fullname, r.email, r.phone, r.order_id].filter(Boolean).join(" ")}
      searchPlaceholder="Buscar nombre, email u orden"
      filters={filters}
      dateOf={(r) => r.created_at}
      now={now}
      defaultSort={{ id: "fecha", desc: true }}
      csvName="asesorias"
      emptyIcon={Sparkles}
      emptyTitle="Todavía no hay asesorías"
      emptyDescription="Cuando alguien llene el formulario de la asesoría en /asesoria/contratar, aparece acá; pasa a activa cuando se confirma el pago."
      detailTitle={(r) => r.fullname ?? "Persona sin nombre"}
      detail={(r) => (
        <DetailList
          items={[
            { label: "Email", value: r.email ? <MailLink email={r.email} /> : <Vacio />, full: true },
            { label: "WhatsApp", value: r.phone ? <WhatsAppLink phone={r.phone} /> : <Vacio />, full: true },
            { label: "Estado", value: <StatusBadge status={r.estado} label={r.estado === "pendiente de pago" ? "Pago pendiente" : undefined} /> },
            { label: "Días restantes", value: <Vigencia r={r} /> },
            { label: "Formulario", value: formatFechaHora(r.created_at) },
            { label: "Pago confirmado", value: r.paid_at ? formatFechaHora(r.paid_at) : <Vacio>Sin pago</Vacio> },
            { label: "Estado en la base", value: r.status ?? <Vacio /> },
            { label: "Orden", value: r.order_id ? <span className="font-mono text-micro break-all">{r.order_id}</span> : <Vacio />, full: true },
          ]}
        />
      )}
    />
  );
}
