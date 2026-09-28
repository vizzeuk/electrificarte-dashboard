import { PageHeader, SectionTitle } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { CifraKpi } from "@/components/cifra-kpi";
import { CategoriasChart } from "@/components/categorias-chart";
import { GraficoCard } from "@/components/grafico-card";
import { PeriodoSelector } from "@/components/periodo-selector";
import { SerieChart } from "@/components/serie-chart";
import { ReviewsModeration } from "@/components/reviews-moderation";
import { ReviewsTable } from "@/components/reviews-table";
import { CATEGORIAS, getAllReviews, getPendingReviews } from "@/lib/data/reviews-data";
import { AGRUPACIONES, consultaDesde, enActual, infoPeriodo, resolverPeriodo } from "@/lib/periodo";
import { cerrarPeriodo, cifraConteo, cifraPromedio, contarPorTramo, promedioPorTramo } from "@/lib/series";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

/**
 * Regla (sep-2026): solo se moderan las reseñas CON fotos, porque lo que puede ser inapropiado
 * es la imagen. Las que llegan solo con texto se publican solas y aparecen en "Todas las reseñas".
 * La cola de moderación NO se filtra por período: lo pendiente siempre se ve.
 */
export default async function ResenasPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const now = Date.now();
  const p0 = resolverPeriodo(sp, now);
  const [pendientes, todas] = await Promise.all([getPendingReviews(), getAllReviews(consultaDesde(p0))]);
  const { p, tramos } = cerrarPeriodo(sp, now, p0, todas.map((r) => r.created_at));
  const info = infoPeriodo(p);
  const por = AGRUPACIONES.find((a) => a.key === p.agrupar)!.porLabel;

  const noRechazadas = todas.filter((r) => r.status !== "rechazada");
  const notas = noRechazadas.map((r) => ({ fecha: r.created_at, valor: r.rating }));
  const fechasPublicadas = todas.filter((r) => r.status === "aprobada").map((r) => r.moderated_at ?? r.created_at);
  const recibidas = cifraConteo(todas.map((r) => r.created_at), p);
  const publicadas = cifraConteo(fechasPublicadas, p);
  const promedio = cifraPromedio(notas, p);
  const categorias = CATEGORIAS.map((c) => {
    const items = noRechazadas.map((r) => ({ fecha: r.created_at, valor: r[c.key] }));
    return { key: c.key, label: c.label, cifra: cifraPromedio(items, p), serie: promedioPorTramo(items, tramos, p) };
  });
  const hayCategorias = noRechazadas.some((r) => enActual(r.created_at, p) && CATEGORIAS.some((c) => r[c.key] != null));
  const enPeriodo = todas.filter((r) => enActual(r.created_at, p) || enActual(r.moderated_at, p));

  return (
    <>
      <PageHeader
        title="Reseñas"
        subtitle="Las reseñas con fotos se revisan antes de publicarse. Las que llegan sin fotos se publican solas."
        actions={<PeriodoSelector key={JSON.stringify(info)} periodo={info} />}
        className="sm:items-start"
      />

      <Kpis>
        <Kpi value={formatNumero(pendientes.length)} label="Por moderar hoy" />
        <CifraKpi label="Recibidas" cifra={recibidas} comparacion={p.comparacion} />
        <CifraKpi label="Publicadas" cifra={publicadas} comparacion={p.comparacion} />
        <CifraKpi label="Nota promedio" cifra={promedio} comparacion={p.comparacion} vacio="Sin notas" hint="De 1 a 5, sin las rechazadas" />
      </Kpis>

      <section className="flex flex-col gap-4">
        <SectionTitle
          title="Por moderar"
          description={
            pendientes.length === 0
              ? "Nada pendiente por ahora."
              : `${formatNumero(pendientes.length)} reseña${pendientes.length === 1 ? "" : "s"} esperando revisión, de la más antigua a la más nueva.`
          }
        />
        <ReviewsModeration reviews={pendientes} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Historial" description={`${p.etiqueta}, ${por}.`} />
        <div className="grid gap-5 lg:grid-cols-2">
          <GraficoCard title="Recibidas y publicadas" description={`Cantidad de reseñas, ${por}`}>
            <SerieChart
              tramos={tramos}
              series={[
                { key: "recibidas", label: "Recibidas", data: contarPorTramo(todas.map((r) => r.created_at), tramos, p), color: "var(--chart-3)" },
                { key: "publicadas", label: "Publicadas", data: contarPorTramo(fechasPublicadas, tramos, p), color: "var(--chart-1)" },
              ]}
            />
          </GraficoCard>
          <GraficoCard title="Nota promedio" description={`De 1 a 5, sin las rechazadas, ${por}`}>
            <SerieChart tramos={tramos} tipo="linea" formato="nota" series={[{ key: "nota", label: "Nota promedio", data: promedioPorTramo(notas, tramos, p), color: "var(--chart-1)" }]} vacio="Sin reseñas en este período." />
          </GraficoCard>
          <GraficoCard title="Nota por categoría" description={`Autonomía, Confort, Agilidad y Calidad, ${por}. Promedio del período y variación al lado de cada una.`} className="lg:col-span-2">
            <CategoriasChart categorias={categorias} tramos={tramos} hayCategorias={hayCategorias} />
          </GraficoCard>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Todas las reseñas" description="Las recibidas o moderadas en el período, de cualquier estado." />
        <ReviewsTable reviews={enPeriodo} now={now} periodo={info} />
      </section>
    </>
  );
}
