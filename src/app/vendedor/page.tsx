import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Kpi, Kpis } from "@/components/kpi";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { FeaturedInsightCard } from "@/components/featured-insight-card";
import { MisOfertasTable } from "@/components/mis-ofertas-table";
import { Button } from "@/components/ui/button";
import { getMisOfertas, getPoolLeads } from "@/lib/data/vendor-data";
import { getCurrentVendor } from "@/lib/auth/vendor";
import { getTopTendencia } from "@/lib/mock/analytics-extra";
import { formatNumero } from "@/lib/utils";

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
    <>
      <PageHeader
        title={saludo ? `Hola, ${saludo}` : "Resumen"}
        subtitle="Así va tu actividad en la red de vendedores oficiales."
      />

      <Kpis>
        <Kpi value={formatNumero(pool.length)} label="Leads disponibles" hint="Puedes ofertar ahora" />
        <Kpi value={formatNumero(ofertas.length)} label="Mis ofertas" hint="Enviadas en total" />
        <Kpi value={formatNumero(enJuego)} label="En evaluación" hint="Pendientes o evaluándose" />
        <Kpi value={formatNumero(ganadas)} label="Ganadas" hint="Ganadoras o aceptadas" />
      </Kpis>

      <FeaturedInsightCard
        label="Incluido en tu suscripción: la analítica del sitio"
        title={`${topTendencia.nombre} está en alza`}
        description="Visitas, demanda por modelo, embudo de conversión y de dónde viene cada comprador: toda la analítica de electrificarte.com para saber qué modelos ofertar."
        trendPct={topTendencia.variacionPct}
        href="/vendedor/analitica"
      />

      <section className="flex flex-col gap-4">
        <SectionTitle
          title="Actividad reciente"
          description="Tus últimas ofertas."
          action={
            <Button variant="outline" size="sm" asChild className="group cursor-pointer">
              <Link href="/vendedor/leads-activos">
                Ver todas <ArrowRight strokeWidth={1.5} className="transition-transform group-hover:translate-x-[3px]" />
              </Link>
            </Button>
          }
        />
        <MisOfertasTable ofertas={recientes} />
      </section>
    </>
  );
}
