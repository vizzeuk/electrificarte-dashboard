import Link from "next/link";
import { Users, Handshake, Trophy, Clock, ArrowRight, Flame } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { FeaturedInsightCard } from "@/components/featured-insight-card";
import { MisOfertasTable } from "@/components/mis-ofertas-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMisOfertas, getPoolLeads } from "@/lib/data/vendor-data";
import { getCurrentVendor } from "@/lib/auth/vendor";
import { getTopTendencia } from "@/lib/mock/analytics-extra";

export const dynamic = "force-dynamic";

const GANADAS = new Set(["ganadora", "aceptada"]);
const EN_JUEGO = new Set(["pendiente", "evaluada"]);

export default async function VendedorOverviewPage() {
  const [vendor, ofertas, pool] = await Promise.all([
    getCurrentVendor(),
    getMisOfertas(),
    getPoolLeads(),
  ]);

  const ganadas = ofertas.filter((o) => GANADAS.has(o.estado ?? "")).length;
  const enJuego = ofertas.filter((o) => EN_JUEGO.has(o.estado ?? "")).length;
  const recientes = ofertas.slice(0, 5);
  const topTendencia = getTopTendencia();
  const saludo = vendor?.nombre || vendor?.nombre_concesionario || "";

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <PageHeader
        title="Resumen"
        subtitle={`Hola${saludo ? `, ${saludo}` : ""} 👋 — así va tu actividad.`}
      />

      <FeaturedInsightCard
        icon={Flame}
        eyebrow="Incluido en tu suscripción — analítica del sitio"
        title={`${topTendencia.nombre} está en alza: +${topTendencia.variacionPct}%`}
        description="Visitas, demanda por modelo, embudo de conversión y de dónde viene cada comprador — toda la analítica de electrificarte.com para decidir en qué modelos invertir."
        trendPct={topTendencia.variacionPct}
        href="/vendedor/analitica"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Leads disponibles" value={String(pool.length)} icon={Handshake} accent="amber" hint="Puedes ofertar ahora" />
        <KpiCard label="Mis ofertas" value={String(ofertas.length)} icon={Users} accent="primary" hint="Enviadas en total" />
        <KpiCard label="En evaluación" value={String(enJuego)} icon={Clock} accent="muted" hint="Pendientes o evaluándose" />
        <KpiCard label="Ganadas" value={String(ganadas)} icon={Trophy} accent="green" hint="Ganadoras o aceptadas" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Tus últimas ofertas</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="cursor-pointer">
            <Link href="/vendedor/leads-activos">
              Ver todas <ArrowRight className="size-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <MisOfertasTable ofertas={recientes} />
        </CardContent>
      </Card>
    </div>
  );
}
