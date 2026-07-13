import { Sparkles, ShoppingBag, Store, Eye } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { TrafficChart } from "@/components/traffic-chart";
import { TopList } from "@/components/top-list";
import { leadsAsesoria } from "@/lib/mock/leads-asesoria";
import { leadsOferta } from "@/lib/mock/leads-oferta";
import { vendedoresActivos } from "@/lib/mock/derived";
import { trafficSeries, topPaginas, topAutos, topMarcas } from "@/lib/mock/traffic";

export default function AdminOverviewPage() {
  const totalVisitas = trafficSeries.reduce((sum, p) => sum + p.visitas, 0);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resumen</h1>
        <p className="text-muted-foreground">Analítica del sitio y estado general del negocio.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Visitas (14 días)" value={totalVisitas.toLocaleString("es-CL")} icon={Eye} accent="primary" />
        <KpiCard label="Leads Asesoría" value={String(leadsAsesoria.length)} icon={Sparkles} accent="amber" hint="$4.990" />
        <KpiCard label="Leads Oferta" value={String(leadsOferta.length)} icon={ShoppingBag} accent="green" hint="$19.990" />
        <KpiCard label="Vendedores activos" value={String(vendedoresActivos().length)} icon={Store} accent="muted" />
      </div>

      <TrafficChart data={trafficSeries} title="Tráfico del sitio" description="Visitas totales de electrificarte.com (últimos 14 días)" />

      <div className="grid gap-4 lg:grid-cols-3">
        <TopList title="Páginas más visitadas" description="Secciones y PLPs" items={topPaginas.map((p) => ({ label: p.label, sublabel: p.ruta, value: p.visitas }))} />
        <TopList title="Autos más visitados" description="PDPs con más tráfico" items={topAutos.map((a) => ({ label: a.nombre, sublabel: a.marca, value: a.visitas }))} />
        <TopList title="Marcas más visitadas" description="Agregado por marca" items={topMarcas.map((m) => ({ label: m.marca, value: m.visitas }))} />
      </div>
    </div>
  );
}
