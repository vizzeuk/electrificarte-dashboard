"use client";

import { Store } from "lucide-react";
import { DataTable, DetailList, Vacio, type Column, type FilterDef } from "@/components/data-table";
import { MailLink, WhatsAppLink } from "@/components/contact-links";
import { StatusBadge, statusLabel } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { VendedorRow } from "@/lib/data/admin-data";
import { parseMarcas } from "@/lib/marcas";
import { formatFecha, formatFechaHora, formatNumero, nombreCompleto } from "@/lib/utils";

const nombre = (v: VendedorRow) => nombreCompleto(v.nombre, v.apellido);
const ubicacion = (v: VendedorRow) => [v.comuna, v.region].map((x) => x?.trim()).filter(Boolean).join(", ");

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

export function VendedoresTable({ rows, now }: { rows: VendedorRow[]; now: number }) {
  const estados = [...new Set(rows.map((r) => (r.estado ?? "").toLowerCase()))].filter(Boolean).sort();
  const regiones = [...new Set(rows.map((r) => r.region?.trim() ?? ""))].filter(Boolean).sort();
  const marcas = [...new Set(rows.flatMap((r) => parseMarcas(r.marcas)))].sort((a, b) => a.localeCompare(b, "es"));

  const columns: Column<VendedorRow>[] = [
    {
      id: "nombre",
      header: "Vendedor",
      primary: true,
      sortValue: (r) => nombre(r)?.toLowerCase() ?? null,
      csv: (r) => nombre(r),
      cell: (r) => (
        <span className="flex flex-col">
          <span className="font-semibold">{nombre(r) ?? <Vacio>Sin nombre</Vacio>}</span>
          {r.nombre_concesionario && <span className="text-muted-foreground text-micro">{r.nombre_concesionario}</span>}
        </span>
      ),
    },
    { id: "punto", header: "Punto de venta", hideOnDesktop: true, csv: (r) => r.nombre_concesionario, cell: (r) => r.nombre_concesionario ?? <Vacio /> },
    {
      id: "contacto",
      header: "Contacto",
      csvHeader: "Email",
      csv: (r) => r.email,
      cell: (r) => (
        <span className="flex flex-col gap-1">
          <MailLink email={r.email} />
          <WhatsAppLink phone={r.telefono} />
        </span>
      ),
    },
    { id: "telefono", header: "Teléfono", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.telefono, cell: (r) => r.telefono },
    {
      id: "zona",
      header: "Zona",
      sortValue: (r) => ubicacion(r) || null,
      csv: (r) => ubicacion(r),
      cell: (r) => ubicacion(r) || <Vacio />,
    },
    { id: "marcas", header: "Marcas", className: "whitespace-normal", csv: (r) => r.marcas, cell: (r) => <Marcas marcas={r.marcas} /> },
    {
      id: "ofertas",
      header: "Ofertas",
      sortValue: (r) => r.ofertas,
      csv: (r) => r.ofertas,
      cell: (r) => <span className="tabular-nums">{formatNumero(r.ofertas)}</span>,
    },
    {
      id: "estado",
      header: "Estado",
      sortValue: (r) => r.estado,
      csv: (r) => r.estado,
      cell: (r) => <StatusBadge status={r.estado} />,
    },
    {
      id: "fecha",
      header: "Registro",
      sortValue: (r) => (r.created_at ? new Date(r.created_at).getTime() : null),
      csv: (r) => formatFechaHora(r.created_at),
      cell: (r) => <span className="tabular-nums">{formatFecha(r.created_at)}</span>,
    },
    { id: "rut", header: "RUT", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.rut_vendors, cell: (r) => r.rut_vendors },
    { id: "financiamientos", header: "Financiamiento", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.financiamientos, cell: (r) => r.financiamientos },
  ];

  const filters: FilterDef<VendedorRow>[] = [
    { id: "estado", label: "Estado", allLabel: "Todos los estados", options: estados.map((e) => ({ value: e, label: statusLabel(e) })), get: (r) => (r.estado ?? "").toLowerCase() },
    { id: "region", label: "Región", allLabel: "Todas las regiones", options: regiones.map((x) => ({ value: x, label: x })), get: (r) => r.region?.trim() ?? "" },
    {
      id: "marca",
      label: "Marca",
      allLabel: "Todas las marcas",
      options: marcas.map((m) => ({ value: m, label: m })),
      match: (r, marca) => parseMarcas(r.marcas).includes(marca),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchText={(r) => [nombre(r), r.nombre_concesionario, r.email, r.telefono, r.comuna, r.region, r.marcas, r.rut_vendors].filter(Boolean).join(" ")}
      searchPlaceholder="Buscar nombre, email o marca"
      filters={filters}
      dateOf={(r) => r.created_at}
      now={now}
      defaultSort={{ id: "fecha", desc: true }}
      csvName="vendedores"
      emptyIcon={Store}
      emptyTitle="Todavía no hay vendedores registrados"
      emptyDescription="Los vendedores se registran en vendedores.electrificarte.com y aparecen acá."
      detailTitle={(r) => nombre(r) ?? "Vendedor sin nombre"}
      detail={(r) => (
        <DetailList
          items={[
            { label: "Punto de venta", value: r.nombre_concesionario ?? <Vacio />, full: true },
            { label: "Email", value: r.email ? <MailLink email={r.email} /> : <Vacio />, full: true },
            { label: "WhatsApp", value: r.telefono ? <WhatsAppLink phone={r.telefono} /> : <Vacio />, full: true },
            { label: "Estado", value: <StatusBadge status={r.estado} /> },
            { label: "RUT", value: r.rut_vendors ?? <Vacio /> },
            { label: "Comuna", value: r.comuna ?? <Vacio /> },
            { label: "Región", value: r.region ?? <Vacio /> },
            { label: "Marcas", value: <Marcas marcas={r.marcas} />, full: true },
            { label: "Financiamiento", value: r.financiamientos ?? <Vacio>No indica</Vacio>, full: true },
            { label: "Ofertas enviadas", value: formatNumero(r.ofertas) },
            { label: "Ofertas ganadas", value: formatNumero(r.ganadas) },
            { label: "Registro", value: formatFechaHora(r.created_at), full: true },
          ]}
        />
      )}
    />
  );
}
