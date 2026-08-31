import { Flame, Eye, Users, Clock, Percent } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { TrafficChart } from "@/components/traffic-chart";
import { TopList } from "@/components/top-list";
import { RankingCard } from "@/components/ranking-card";
import { DonutBreakdown } from "@/components/donut-breakdown";
import { FunnelCard } from "@/components/funnel-card";
import { FeaturedInsightCard } from "@/components/featured-insight-card";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConcesionarioVentas } from "@/lib/data/ranking-data";
import { trafficSeries, topPaginas, topAutos, topMarcas } from "@/lib/mock/traffic";
import {
  trafficSources,
  deviceBreakdown,
  topRegiones,
  funnelConversion,
  modelosTendencia,
  comparacionesFrecuentes,
  engagement,
  getTopTendencia,
} from "@/lib/mock/analytics-extra";

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">{children}</p>;
}

/** Página completa de analítica del sitio — compartida 1:1 entre /admin/analitica y
 * /vendedor/analitica. Este es el producto que Francisco vende a los vendedores: tráfico,
 * demanda por modelo/marca, embudo de conversión y comportamiento de los visitantes.
 *
 * `action` es un slot opcional para la capa de "qué hacer con el dato". Es específica del
 * vendedor (se filtra por sus marcas), así que la inyecta la página de vendedor y el admin
 * la deja vacía — los números siguen siendo idénticos en ambos roles. */
export function SiteAnalytics({
  action,
  topConcesionarios = [],
}: {
  action?: React.ReactNode;
  topConcesionarios?: ConcesionarioVentas[];
} = {}) {
  const totalVisitas = trafficSeries.reduce((sum, p) => sum + p.visitas, 0);
  const last7 = trafficSeries.slice(-7).reduce((sum, p) => sum + p.visitas, 0);
  const prev7 = trafficSeries.slice(0, 7).reduce((sum, p) => sum + p.visitas, 0);
  const visitasDeltaPct = Math.round(((last7 - prev7) / prev7) * 100);

  const tendenciaOrdenada = [...modelosTendencia].sort((a, b) => b.variacionPct - a.variacionPct);
  const topTendencia = getTopTendencia();

  const primerPaso = funnelConversion[0].usuarios;
  const ultimoPaso = funnelConversion[funnelConversion.length - 1].usuarios;
  const conversionPct = Math.round((ultimoPaso / primerPaso) * 1000) / 10;

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <PageHeader
        title="Analítica del sitio"
        subtitle="Tráfico, demanda por modelo y comportamiento de los visitantes de electrificarte.com."
      />

      <FeaturedInsightCard
        icon={Flame}
        eyebrow="Modelo en mayor tendencia esta semana"
        title={`${topTendencia.nombre} — ${topTendencia.marca}`}
        description={`${topTendencia.visitas.toLocaleString("es-CL")} visitas a su ficha esta semana, con el mayor crecimiento del catálogo. Una señal temprana de hacia qué modelo se está moviendo la demanda.`}
        trendPct={topTendencia.variacionPct}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Visitas totales (14 días)"
          value={totalVisitas.toLocaleString("es-CL")}
          icon={Eye}
          accent="primary"
          deltaPct={visitasDeltaPct}
          trend={trafficSeries.map((p) => p.visitas)}
          hint="vs. semana anterior"
        />
        <KpiCard
          label="Visitantes nuevos"
          value={`${engagement.visitantesNuevosPct}%`}
          icon={Users}
          accent="green"
          hint={`${engagement.visitantesRecurrentesPct}% recurrentes`}
        />
        <KpiCard
          label="Duración promedio"
          value={`${Math.floor(engagement.duracionPromedioSeg / 60)}m ${engagement.duracionPromedioSeg % 60}s`}
          icon={Clock}
          accent="amber"
          hint={`${engagement.paginasPorSesion} páginas por sesión`}
        />
        <KpiCard
          label="Conversión a formulario"
          value={`${conversionPct}%`}
          icon={Percent}
          accent="muted"
          hint="De visita a formulario completado"
        />
      </div>

      {action && (
        <div className="space-y-3">
          <SectionEyebrow>Acción recomendada</SectionEyebrow>
          {action}
        </div>
      )}

      <div className="space-y-3">
        <SectionEyebrow>Tráfico</SectionEyebrow>
        <div className="grid gap-4 lg:grid-cols-3">
          <TrafficChart
            data={trafficSeries}
            title="Tráfico del sitio"
            description="Visitas totales de electrificarte.com (últimos 14 días)"
            className="lg:col-span-2"
          />
          <DonutBreakdown
            title="Canales de adquisición"
            description="De dónde llegan las visitas"
            items={trafficSources.map((s) => ({ label: s.canal, value: s.porcentaje }))}
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionEyebrow>Mercado — demanda por modelo y marca</SectionEyebrow>
        <div className="grid gap-4 lg:grid-cols-2">
          <RankingCard
            title="Modelos en tendencia"
            description="Mayor variación de visitas semana vs. semana anterior"
            items={tendenciaOrdenada.map((m) => ({ label: m.nombre, sublabel: m.marca, value: m.visitas, trendPct: m.variacionPct }))}
          />
          <TopList title="Marcas más visitadas" description="Agregado por marca" items={topMarcas.map((m) => ({ label: m.marca, value: m.visitas }))} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TopList title="Páginas más visitadas" description="Secciones y PLPs" items={topPaginas.map((p) => ({ label: p.label, sublabel: p.ruta, value: p.visitas }))} />
          <TopList title="Autos más visitados" description="PDPs con más tráfico" items={topAutos.map((a) => ({ label: a.nombre, sublabel: a.marca, value: a.visitas }))} />
        </div>
      </div>

      <div className="space-y-3">
        <SectionEyebrow>Red de vendedores</SectionEyebrow>
        {topConcesionarios.length > 0 ? (
          <TopList
            title="Concesionarios que más venden"
            description="Ventas cerradas por concesionario en la red"
            items={topConcesionarios.map((c) => ({ label: c.concesionario, sublabel: c.region ?? undefined, value: c.ventas }))}
            valueLabel="ventas"
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Concesionarios que más venden</CardTitle>
              <CardDescription>Todavía no hay ventas cerradas registradas. El ranking aparece a medida que se cierran ofertas.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        <SectionEyebrow>Quién visita y desde dónde</SectionEyebrow>
        <div className="grid gap-4 lg:grid-cols-2">
          <DonutBreakdown
            title="Dispositivo"
            description="Desde qué dispositivo navegan"
            items={deviceBreakdown.map((d) => ({ label: d.dispositivo, value: d.porcentaje }))}
          />
          <TopList
            title="Regiones con más visitas"
            description="Dónde se concentra la demanda"
            items={topRegiones.map((r) => ({ label: r.region, value: r.visitas }))}
          />
        </div>
      </div>

      <div className="space-y-3">
        <SectionEyebrow>Conversión</SectionEyebrow>
        <FunnelCard
          title="Embudo de conversión"
          description="Del primer clic al formulario completado"
          steps={funnelConversion}
        />
      </div>

      <div className="space-y-3">
        <SectionEyebrow>Comparaciones</SectionEyebrow>
        <TopList
          title="Autos que más se comparan entre sí"
          description="Pares más usados en el comparador — con qué compite cada modelo"
          items={comparacionesFrecuentes.map((c) => ({ label: `${c.autoA} vs. ${c.autoB}`, value: c.veces }))}
          valueLabel="comparaciones"
        />
      </div>
    </div>
  );
}
