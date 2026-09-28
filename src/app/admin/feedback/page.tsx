import { PageHeader } from "@/components/page-header";
import { Kpis } from "@/components/kpi";
import { CifraKpi } from "@/components/cifra-kpi";
import { GraficoCard } from "@/components/grafico-card";
import { PeriodoSelector } from "@/components/periodo-selector";
import { SerieChart } from "@/components/serie-chart";
import { FeedbackTable } from "@/components/admin/feedback-table";
import { getRatings } from "@/lib/data/admin-data";
import { AGRUPACIONES, consultaDesde, enActual, infoPeriodo, resolverPeriodo } from "@/lib/periodo";
import { cerrarPeriodo, cifraConteo, cifraPromedio, contarPorTramo, promedioPorTramo } from "@/lib/series";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function FeedbackPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const now = Date.now();
  const p0 = resolverPeriodo(sp, now);
  const rows = await getRatings(consultaDesde(p0));
  const { p, tramos } = cerrarPeriodo(sp, now, p0, rows.map((r) => r.created_at));
  const info = infoPeriodo(p);
  const por = AGRUPACIONES.find((a) => a.key === p.agrupar)!.porLabel;

  const notas = rows.map((r) => ({ fecha: r.created_at, valor: r.stars }));
  const promedio = cifraPromedio(notas, p);
  const calificaciones = cifraConteo(rows.map((r) => r.created_at), p);
  const conComentario = cifraConteo(rows.filter((r) => r.feedback?.trim()).map((r) => r.created_at), p);
  const bajas = cifraConteo(rows.filter((r) => r.stars != null && r.stars > 0 && r.stars <= 2).map((r) => r.created_at), p);
  const enPeriodo = rows.filter((r) => enActual(r.created_at, p));

  return (
    <>
      <PageHeader
        title="Feedback del sitio"
        subtitle="Calificaciones y comentarios que dejan las personas con el botón “Tu opinión” del sitio."
        actions={<PeriodoSelector key={JSON.stringify(info)} periodo={info} />}
        className="sm:items-start"
      />
      <Kpis>
        <CifraKpi label="Nota promedio" cifra={promedio} comparacion={p.comparacion} vacio="Sin notas" hint="De 1 a 5 estrellas" />
        <CifraKpi label="Calificaciones" cifra={calificaciones} comparacion={p.comparacion} />
        <CifraKpi label="Con comentario" cifra={conComentario} comparacion={p.comparacion} />
        <CifraKpi label="Notas de 1 o 2" cifra={bajas} comparacion={p.comparacion} hint="Conviene leerlas primero" />
      </Kpis>
      <div className="grid gap-5 lg:grid-cols-2">
        <GraficoCard title="Nota promedio en el tiempo" description={`De 1 a 5, ${por}`}>
          <SerieChart tramos={tramos} tipo="linea" formato="nota" series={[{ key: "nota", label: "Nota promedio", data: promedioPorTramo(notas, tramos, p), color: "var(--chart-1)" }]} vacio="Sin calificaciones en este período." />
        </GraficoCard>
        <GraficoCard title="Calificaciones en el tiempo" description={`Cantidad, ${por}`}>
          <SerieChart tramos={tramos} series={[{ key: "calificaciones", label: "Calificaciones", data: contarPorTramo(rows.map((r) => r.created_at), tramos, p), color: "var(--chart-1)" }]} />
        </GraficoCard>
      </div>
      <FeedbackTable rows={enPeriodo} now={now} periodo={info} />
    </>
  );
}
