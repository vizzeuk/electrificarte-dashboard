import Link from "next/link";
import { Sparkles, ShoppingBag, Store, Eye, Flame, ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { FeaturedInsightCard } from "@/components/featured-insight-card";
import { Button } from "@/components/ui/button";
import { leadsAsesoria } from "@/lib/mock/leads-asesoria";
import { leadsOferta } from "@/lib/mock/leads-oferta";
import { vendedoresActivos } from "@/lib/mock/derived";
import { trafficSeries } from "@/lib/mock/traffic";
import { getTopTendencia } from "@/lib/mock/analytics-extra";

export default function AdminOverviewPage() {
  const totalVisitas = trafficSeries.reduce((sum, p) => sum + p.visitas, 0);
  const topTendencia = getTopTendencia();

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>
        <p className="text-muted-foreground">Estado general del negocio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Visitas (14 días)" value={totalVisitas.toLocaleString("es-CL")} icon={Eye} accent="primary" />
        <KpiCard label="Leads Asesoría" value={String(leadsAsesoria.length)} icon={Sparkles} accent="amber" hint="$4.990" />
        <KpiCard label="Leads Oferta" value={String(leadsOferta.length)} icon={ShoppingBag} accent="green" hint="$19.990" />
        <KpiCard label="Vendedores activos" value={String(vendedoresActivos().length)} icon={Store} accent="muted" />
      </div>

      <FeaturedInsightCard
        icon={Flame}
        eyebrow="Esto es lo que ven los vendedores en su suscripción"
        title={`${topTendencia.nombre} está en alza: +${topTendencia.variacionPct}%`}
        description="Tráfico, demanda por modelo/marca, embudo de conversión y de dónde vienen los visitantes — la analítica completa que se vende a los vendedores oficiales."
        trendPct={topTendencia.variacionPct}
      />

      <div className="flex justify-end">
        <Button variant="outline" size="sm" asChild className="cursor-pointer">
          <Link href="/admin/analitica">
            Ver analítica completa <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
