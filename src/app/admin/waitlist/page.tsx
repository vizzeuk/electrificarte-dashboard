import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { CifraKpi } from "@/components/cifra-kpi";
import { GraficoCard } from "@/components/grafico-card";
import { PeriodoSelector } from "@/components/periodo-selector";
import { SerieChart } from "@/components/serie-chart";
import { BarList, contarPor } from "@/components/bar-list";
import { WaitlistTable } from "@/components/admin/waitlist-table";
import { clavePersona, getWaitlist } from "@/lib/data/admin-data";
import { fuenteLabel } from "@/lib/labels";
import { AGRUPACIONES, consultaDesde, enActual, infoPeriodo, resolverPeriodo } from "@/lib/periodo";
import { cerrarPeriodo, cifraConteo, contarPorTramo } from "@/lib/series";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function WaitlistPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const now = Date.now();
  const p0 = resolverPeriodo(sp, now);
  const { rows, todas } = await getWaitlist(consultaDesde(p0));

  // Primera inscripción de cada persona = "persona nueva".
  const primeras = new Map<string, string | null>();
  for (const r of [...todas].reverse()) if (!primeras.has(clavePersona(r))) primeras.set(clavePersona(r), r.created_at);
  const fechasPersonas = [...primeras.values()];

  const { p, tramos } = cerrarPeriodo(sp, now, p0, fechasPersonas);
  const info = infoPeriodo(p);
  const por = AGRUPACIONES.find((a) => a.key === p.agrupar)!.porLabel;

  const enPeriodo = rows.filter((r) => enActual(r.created_at, p));
  const personasPeriodo = enPeriodo.filter((r) => r.ultima);
  const nuevas = cifraConteo(fechasPersonas, p);
  const inscripciones = cifraConteo(rows.map((r) => r.created_at), p);
  const sinContactar = new Set(todas.filter((r) => !r.contacted).map(clavePersona)).size;

  return (
    <>
      <PageHeader
        title="Waitlist"
        subtitle="Personas que dejaron sus datos para recibir ofertas de autos. Es la base de demanda que se le ofrecerá a la red de vendedores oficiales."
        actions={<PeriodoSelector key={JSON.stringify(info)} periodo={info} />}
        className="sm:items-start"
      />

      <Kpis>
        <CifraKpi label="Personas nuevas" cifra={nuevas} comparacion={p.comparacion} hint="Primera inscripción de cada persona" />
        <CifraKpi
          label="Inscripciones"
          cifra={inscripciones}
          comparacion={p.comparacion}
          hint={inscripciones.actual !== nuevas.actual ? "Incluye repetidas" : undefined}
        />
        <Kpi value={formatNumero(primeras.size)} label="Personas en la waitlist hoy" hint={`${formatNumero(todas.length)} inscripciones en total`} />
        <Kpi value={formatNumero(sinContactar)} label="Sin contactar hoy" />
      </Kpis>

      <GraficoCard title="Inscripciones en el tiempo" description={`${p.etiqueta}, ${por}`}>
        <SerieChart
          tramos={tramos}
          series={[
            { key: "inscripciones", label: "Inscripciones", data: contarPorTramo(rows.map((r) => r.created_at), tramos, p), color: "var(--chart-3)" },
            { key: "personas", label: "Personas nuevas", data: contarPorTramo(fechasPersonas, tramos, p), color: "var(--chart-1)" },
          ]}
        />
      </GraficoCard>

      {personasPeriodo.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <BarList
            title="De dónde llegan"
            description="Botón o sección del sitio desde donde se inscribieron, en el período"
            items={contarPor(personasPeriodo, (r) => fuenteLabel(r.source))}
          />
          <BarList
            title="Modelos que más piden"
            description="Auto de interés que dejaron al inscribirse (opcional), en el período"
            items={contarPor(personasPeriodo, (r) => r.model, "No indicó modelo")}
          />
        </div>
      )}

      <WaitlistTable rows={enPeriodo} now={now} periodo={info} />
    </>
  );
}
