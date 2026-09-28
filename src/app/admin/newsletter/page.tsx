import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { CifraKpi } from "@/components/cifra-kpi";
import { GraficoCard } from "@/components/grafico-card";
import { PeriodoSelector } from "@/components/periodo-selector";
import { SerieChart } from "@/components/serie-chart";
import { NewsletterTable } from "@/components/admin/newsletter-table";
import { getNewsletter } from "@/lib/data/admin-data";
import { AGRUPACIONES, consultaDesde, enActual, infoPeriodo, resolverPeriodo } from "@/lib/periodo";
import { cerrarPeriodo, cifraConteo, contarPorTramo } from "@/lib/series";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function NewsletterPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const now = Date.now();
  const p0 = resolverPeriodo(sp, now);
  // Los totales de hoy necesitan la lista completa de correos (liviana: id, fecha y email).
  const todas = await getNewsletter();
  const desde = consultaDesde(p0);
  const rows = desde == null ? todas : todas.filter((r) => r.created_at && Date.parse(r.created_at) >= desde);
  const { p, tramos } = cerrarPeriodo(sp, now, p0, rows.map((r) => r.created_at));
  const info = infoPeriodo(p);
  const por = AGRUPACIONES.find((a) => a.key === p.agrupar)!.porLabel;

  const unicos = new Set(todas.map((r) => (r.email ?? "").trim().toLowerCase()).filter(Boolean)).size;
  const nuevas = cifraConteo(rows.map((r) => r.created_at), p);
  const enPeriodo = rows.filter((r) => enActual(r.created_at, p));

  return (
    <>
      <PageHeader
        title="Newsletter"
        subtitle="Correos suscritos al newsletter desde el sitio."
        actions={<PeriodoSelector key={JSON.stringify(info)} periodo={info} />}
        className="sm:items-start"
      />
      <Kpis cols={3}>
        <CifraKpi label="Suscripciones nuevas" cifra={nuevas} comparacion={p.comparacion} />
        <Kpi value={formatNumero(unicos)} label="Correos suscritos hoy" hint={todas.length !== unicos ? `${formatNumero(todas.length)} suscripciones en total` : undefined} />
      </Kpis>
      <GraficoCard title="Suscripciones en el tiempo" description={`${p.etiqueta}, ${por}`}>
        <SerieChart tramos={tramos} series={[{ key: "suscripciones", label: "Suscripciones", data: contarPorTramo(rows.map((r) => r.created_at), tramos, p), color: "var(--chart-1)" }]} />
      </GraficoCard>
      <NewsletterTable rows={enPeriodo} now={now} periodo={info} />
    </>
  );
}
