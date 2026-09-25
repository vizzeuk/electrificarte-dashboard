"use client";

import { PauseCircle } from "lucide-react";
import { DataTable, DetailList, Vacio, type Column, type FilterDef } from "@/components/data-table";
import { MailLink, OutLink, WhatsAppLink } from "@/components/contact-links";
import { StatusBadge, statusLabel } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import type { LeadRow } from "@/lib/data/admin-data";
import { financiamientoLabel, fuenteLabel } from "@/lib/labels";
import { autoUrl, formatFecha, formatFechaHora, formatNumero, hace, nombreCompleto, slugATitulo } from "@/lib/utils";

const nombre = (l: LeadRow) => nombreCompleto(l.first_name, l.last_name);
const ubicacion = (l: LeadRow) => [l.comuna, l.region].map((x) => x?.trim()).filter(Boolean).join(", ");
const esPrueba = (l: LeadRow) => (l.origen ?? "").toLowerCase().includes("test");

function Modelo({ l }: { l: LeadRow }) {
  const m = l.target_model?.trim();
  if (!m) return l.descripcion_interes ? <span>{l.descripcion_interes}</span> : <Vacio>No indicó</Vacio>;
  const url = autoUrl(m);
  return url ? <OutLink href={url}>{slugATitulo(m)}</OutLink> : <span className="font-medium">{m}</span>;
}

function partePago(l: LeadRow): string | null {
  return [l.parte_pago_marca, l.parte_pago_modelo, l.parte_pago_ano].filter(Boolean).join(" ") || null;
}

export function LeadsOfertaTable({ rows, now }: { rows: LeadRow[]; now: number }) {
  const estados = [...new Set(rows.map((r) => (r.status ?? "").toLowerCase()))].filter(Boolean).sort();
  const origenes = [...new Set(rows.map((r) => r.origen ?? ""))].filter(Boolean).sort();

  const columns: Column<LeadRow>[] = [
    {
      id: "nombre",
      header: "Cliente",
      primary: true,
      sortValue: (r) => nombre(r)?.toLowerCase() ?? null,
      csv: (r) => nombre(r),
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{nombre(r) ?? <Vacio>Sin nombre</Vacio>}</span>
          {esPrueba(r) && <Badge variant="secondary">Prueba</Badge>}
        </span>
      ),
    },
    {
      id: "contacto",
      header: "Contacto",
      csvHeader: "Email",
      csv: (r) => r.email,
      cell: (r) =>
        r.email || r.telefono ? (
          <span className="flex flex-col gap-1">
            <MailLink email={r.email} />
            <WhatsAppLink phone={r.telefono} />
          </span>
        ) : (
          <Vacio />
        ),
    },
    { id: "telefono", header: "Teléfono", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.telefono, cell: (r) => r.telefono },
    { id: "modelo", header: "Busca", sortValue: (r) => r.target_model?.toLowerCase() ?? null, csv: (r) => r.target_model, cell: (r) => <Modelo l={r} /> },
    { id: "zona", header: "Zona", sortValue: (r) => ubicacion(r) || null, csv: (r) => ubicacion(r), cell: (r) => ubicacion(r) || <Vacio /> },
    { id: "ofertas", header: "Ofertas", sortValue: (r) => r.ofertas, csv: (r) => r.ofertas, cell: (r) => <span className="tabular-nums">{formatNumero(r.ofertas)}</span> },
    { id: "estado", header: "Estado", sortValue: (r) => r.status, csv: (r) => r.status, cell: (r) => <StatusBadge status={r.status} /> },
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
    { id: "origen", header: "Origen", hideOnDesktop: true, csv: (r) => r.origen, cell: (r) => fuenteLabel(r.origen) },
    { id: "financiamiento", header: "Financiamiento", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.financing, cell: (r) => financiamientoLabel(r.financing) },
    { id: "parte_pago", header: "Parte de pago", hideOnDesktop: true, hideOnMobile: true, csv: (r) => partePago(r), cell: (r) => partePago(r) },
    { id: "orden", header: "Orden", hideOnDesktop: true, hideOnMobile: true, csv: (r) => r.order_id, cell: (r) => r.order_id },
  ];

  const filters: FilterDef<LeadRow>[] = [
    { id: "estado", label: "Estado", allLabel: "Todos los estados", options: estados.map((e) => ({ value: e, label: statusLabel(e) })), get: (r) => (r.status ?? "").toLowerCase() },
    { id: "origen", label: "Origen", allLabel: "Todos los orígenes", options: origenes.map((o) => ({ value: o, label: fuenteLabel(o) })), get: (r) => r.origen ?? "" },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      getRowId={(r) => r.id}
      searchText={(r) => [nombre(r), r.email, r.telefono, r.target_model, r.descripcion_interes, r.comuna, r.region, r.order_id].filter(Boolean).join(" ")}
      searchPlaceholder="Buscar nombre, email o modelo"
      filters={filters}
      dateOf={(r) => r.created_at}
      now={now}
      defaultSort={{ id: "fecha", desc: true }}
      csvName="leads-oferta"
      emptyIcon={PauseCircle}
      emptyTitle="No hay leads de Oferta Exclusiva"
      emptyDescription="El producto está en pausa, así que no entran leads nuevos."
      detailTitle={(r) => nombre(r) ?? "Lead sin nombre"}
      detail={(r) => {
        const pp = partePago(r);
        return (
          <div className="flex flex-col gap-6">
            <DetailList
              items={[
                { label: "Email", value: r.email ? <MailLink email={r.email} /> : <Vacio />, full: true },
                { label: "WhatsApp", value: r.telefono ? <WhatsAppLink phone={r.telefono} /> : <Vacio />, full: true },
                { label: "Busca", value: <Modelo l={r} />, full: true },
                { label: "Zona", value: ubicacion(r) || <Vacio /> },
                { label: "Financiamiento", value: financiamientoLabel(r.financing) ?? <Vacio /> },
                { label: "Estado", value: <StatusBadge status={r.status} /> },
                { label: "Ofertas recibidas", value: formatNumero(r.ofertas) },
                { label: "Origen", value: fuenteLabel(r.origen) },
                { label: "Fecha", value: formatFechaHora(r.created_at) },
                { label: "Cierre de la ventana", value: r.cierra_at ? formatFechaHora(r.cierra_at) : <Vacio /> },
                { label: "Cerrada", value: r.cerrada_at ? formatFechaHora(r.cerrada_at) : <Vacio>No</Vacio> },
                { label: "Orden", value: r.order_id ? <span className="font-mono text-micro break-all">{r.order_id}</span> : <Vacio />, full: true },
              ]}
            />
            <div className="border-t pt-5">
              <h3 className="mb-3 text-small font-semibold">Parte de pago</h3>
              {pp ? (
                <DetailList
                  items={[
                    { label: "Auto", value: pp, full: true },
                    { label: "Kilometraje", value: r.parte_pago_km ? `${r.parte_pago_km} km` : <Vacio /> },
                    { label: "Dueños", value: r.parte_pago_duenos ?? <Vacio /> },
                    { label: "Deuda", value: r.parte_pago_deuda ?? <Vacio /> },
                    { label: "Mantenciones", value: r.parte_pago_mantenciones ?? <Vacio /> },
                    { label: "Patente", value: r.parte_pago_patente ?? <Vacio /> },
                  ]}
                />
              ) : (
                <p className="text-muted-foreground text-small">No declaró parte de pago.</p>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
