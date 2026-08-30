import Link from "next/link";
import { ShoppingBag, Store, Handshake, Flame, ArrowRight } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { FeaturedInsightCard } from "@/components/featured-insight-card";
import { Button } from "@/components/ui/button";
import { getAdminOverview } from "@/lib/data/admin-data";
import { getTopTendencia } from "@/lib/mock/analytics-extra";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  const topTendencia = getTopTendencia();

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <PageHeader title="Resumen" subtitle="Estado general del negocio." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Leads Oferta" value={String(overview.leadsOferta)} icon={ShoppingBag} accent="green" hint="Pagados ($19.990)" />
        <KpiCard label="Vendedores activos" value={String(overview.vendedoresActivos)} icon={Store} accent="primary" hint={`${overview.vendedoresTotal} en total`} />
        <KpiCard label="Ofertas recibidas" value={String(overview.ofertas)} icon={Handshake} accent="muted" hint="Pujas de la red" />
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
