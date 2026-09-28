import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { CifraKpi } from "@/components/cifra-kpi";
import { GraficoCard } from "@/components/grafico-card";
import { PeriodoSelector } from "@/components/periodo-selector";
import { SerieChart } from "@/components/serie-chart";
import { AsesoriasTable } from "@/components/admin/asesorias-table";
import { ASESORIA_DIAS, fechaPago, getAsesorias } from "@/lib/data/admin-data";
import { AGRUPACIONES, consultaDesde, DIA_MS, enActual, infoPeriodo, resolverPeriodo } from "@/lib/periodo";
import { cerrarPeriodo, cifraConteo, cifraTasa, contarPorTramo } from "@/lib/series";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function AsesoriasPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const now = Date.now();
  const p0 = resolverPeriodo(sp, now);
  const desde = consultaDesde(p0);
  // "Activas hoy" necesita al menos los últimos días de vigencia, sea cual sea el período.
  const { rows, fuente } = await getAsesorias(desde == null ? null : Math.min(desde, now - (ASESORIA_DIAS + 1) * DIA_MS));

  const { p, tramos } = cerrarPeriodo(sp, now, p0, rows.map((r) => r.created_at));
  const info = infoPeriodo(p);
  const por = AGRUPACIONES.find((a) => a.key === p.agrupar)!.porLabel;

  const pagos = rows.map(fechaPago);
  const formularios = cifraConteo(rows.map((r) => r.created_at), p);
  const pagadas = cifraConteo(pagos, p);
  const conversion = cifraTasa(pagadas, formularios);
  const activas = rows.filter((r) => r.estado === "activa");
  const vencenPronto = activas.filter((r) => r.dias_restantes <= 2).length;
  // En la tabla: lo que entró o se pagó en el período.
  const enPeriodo = rows.filter((r, i) => enActual(r.created_at, p) || enActual(pagos[i], p));

  return (
    <>
      <PageHeader
        title="Asesorías"
        subtitle={`Personas que contrataron la asesoría por WhatsApp ($4.990). Dura ${ASESORIA_DIAS} días desde el pago.`}
        actions={<PeriodoSelector key={JSON.stringify(info)} periodo={info} />}
        className="sm:items-start"
      />

      <Kpis>
        <CifraKpi label="Formularios recibidos" cifra={formularios} comparacion={p.comparacion} />
        <CifraKpi label="Asesorías pagadas" cifra={pagadas} comparacion={p.comparacion} hint="Por fecha de pago" />
        <CifraKpi label="Conversión" cifra={conversion} comparacion={p.comparacion} vacio="Sin formularios" hint="Pagadas sobre formularios" />
        <Kpi value={formatNumero(activas.length)} label="Activas hoy" hint={vencenPronto > 0 ? `${formatNumero(vencenPronto)} vencen en 2 días o menos` : "Ninguna por vencer"} />
      </Kpis>

      <GraficoCard title="Formularios y pagos en el tiempo" description={`${p.etiqueta}, ${por}`}>
        <SerieChart
          tramos={tramos}
          series={[
            { key: "formularios", label: "Formularios", data: contarPorTramo(rows.map((r) => r.created_at), tramos, p), color: "var(--chart-3)" },
            { key: "pagadas", label: "Pagadas", data: contarPorTramo(pagos, tramos, p), color: "var(--chart-1)" },
          ]}
        />
      </GraficoCard>

      <AsesoriasTable rows={enPeriodo} now={now} periodo={info} />

      <p className="text-muted-foreground text-small">
        {fuente === "vista"
          ? "Estado y días restantes según la vista asesorias_estado de Supabase."
          : `Estado y días restantes calculados con la misma regla del bot: ${ASESORIA_DIAS} días desde el pago (o desde el formulario si falta la fecha de pago).`}{" "}
        La tabla muestra las asesorías con formulario o pago dentro del período.
      </p>
    </>
  );
}
