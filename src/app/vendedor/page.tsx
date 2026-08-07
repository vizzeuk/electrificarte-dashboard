import Link from "next/link";
import { Users, Handshake, TrendingUp, Percent, ArrowRight, Flame } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { TrafficChart } from "@/components/traffic-chart";
import { FeaturedInsightCard } from "@/components/featured-insight-card";
import { LeadsOfertaTable } from "@/components/leads-oferta-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { leadsActivosVendedor, leadsDisponiblesVendedor, vendedorActual } from "@/lib/mock/derived";
import { ofertasPorSemana } from "@/lib/mock/vendedor-performance";
import { getTopTendencia } from "@/lib/mock/analytics-extra";

export default function VendedorOverviewPage() {
  const activos = leadsActivosVendedor();
  const disponibles = leadsDisponiblesVendedor();
  const yo = vendedorActual();
  const cerrados = activos.filter((l) => l.estado === "cerrado").length;
  const recientes = [...activos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);
  const topTendencia = getTopTendencia();

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>
        <p className="text-muted-foreground">
          Hola, {yo.nombre} 👋 — así va tu desempeño.
        </p>
      </div>

      <FeaturedInsightCard
        icon={Flame}
        eyebrow="Incluido en tu suscripción — analítica del sitio"
        title={`${topTendencia.nombre} está en alza: +${topTendencia.variacionPct}%`}
        description="Visitas, demanda por modelo, embudo de conversión y de dónde viene cada comprador — toda la analítica de electrificarte.com para decidir en qué modelos invertir."
        trendPct={topTendencia.variacionPct}
        href="/vendedor/analitica"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Leads activos" value={String(activos.length)} icon={Users} accent="primary" hint="Asignados a ti" />
        <KpiCard label="Leads disponibles" value={String(disponibles.length)} icon={Handshake} accent="amber" hint="Puedes ofertar ahora" />
        <KpiCard label="Ofertas ganadas" value={String(cerrados)} icon={TrendingUp} accent="green" hint="Cerradas con éxito" />
        <KpiCard label="Tasa de respuesta" value={`${yo.tasaRespuesta}%`} icon={Percent} accent="muted" hint="Tu promedio" />
      </div>

      <TrafficChart
        data={ofertasPorSemana}
        title="Tus ofertas enviadas"
        description="Últimas 6 semanas"
        seriesLabel="Ofertas"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Tus leads activos más recientes</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="cursor-pointer">
            <Link href="/vendedor/leads-activos">
              Ver todos <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <LeadsOfertaTable leads={recientes} />
        </CardContent>
      </Card>
    </div>
  );
}
