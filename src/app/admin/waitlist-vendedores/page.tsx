import { Database } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { CifraKpi } from "@/components/cifra-kpi";
import { EmptyState } from "@/components/empty-state";
import { GraficoCard } from "@/components/grafico-card";
import { PeriodoSelector } from "@/components/periodo-selector";
import { SerieChart } from "@/components/serie-chart";
import { BarList, contarPor } from "@/components/bar-list";
import { WaitlistVendedoresTable } from "@/components/admin/waitlist-vendedores-table";
import { getWaitlistVendedores } from "@/lib/data/admin-data";
import { parseMarcas } from "@/lib/marcas";
import { AGRUPACIONES, consultaDesde, enActual, infoPeriodo, resolverPeriodo } from "@/lib/periodo";
import { cerrarPeriodo, cifraConteo, contarPorTramo } from "@/lib/series";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

/**
 * Vendedores que dejaron sus datos mientras la suscripción de vendedores está en pausa. Es
 * distinta de la Waitlist (compradores). Tabla `waitlist_vendedores` (migración del 27-sep).
 */
export default async function WaitlistVendedoresPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const now = Date.now();
  const p0 = resolverPeriodo(sp, now);
  const { rows, disponible, total, sinContactar } = await getWaitlistVendedores(consultaDesde(p0));
  const { p, tramos } = cerrarPeriodo(sp, now, p0, rows.map((r) => r.created_at));
  const info = infoPeriodo(p);
  const por = AGRUPACIONES.find((a) => a.key === p.agrupar)!.porLabel;

  const header = (
    <PageHeader
      title="Waitlist de vendedores"
      subtitle="Personas que venden autos electrificados y quieren sumarse a la red cuando abra la suscripción de vendedores."
      actions={disponible ? <PeriodoSelector key={JSON.stringify(info)} periodo={info} /> : undefined}
      className="sm:items-start"
    />
  );

  if (!disponible) {
    return (
      <>
        {header}
        <div className="rounded-card border">
          <EmptyState
            icon={Database}
            title="La tabla todavía no existe en Supabase"
            description="Falta correr la migración scripts/sql/2026-09-27_resenas_categorias_y_waitlist_vendedores.sql de la web en el SQL Editor de Supabase. Apenas exista, esta sección se llena sola."
          />
        </div>
      </>
    );
  }

  const nuevos = cifraConteo(rows.map((r) => r.created_at), p);
  const enPeriodo = rows.filter((r) => enActual(r.created_at, p));
  const marcas = enPeriodo.flatMap((r) => parseMarcas(r.marcas).map((m) => ({ m })));

  return (
    <>
      {header}

      <Kpis>
        <CifraKpi label="Registros nuevos" cifra={nuevos} comparacion={p.comparacion} />
        <Kpi value={formatNumero(total)} label="En la lista hoy" />
        <Kpi value={formatNumero(sinContactar)} label="Sin contactar hoy" />
        <Kpi value={formatNumero(new Set(enPeriodo.map((r) => r.region?.trim()).filter(Boolean)).size)} label="Regiones en el período" />
      </Kpis>

      <GraficoCard title="Registros en el tiempo" description={`${p.etiqueta}, ${por}`}>
        <SerieChart tramos={tramos} series={[{ key: "registros", label: "Registros", data: contarPorTramo(rows.map((r) => r.created_at), tramos, p), color: "var(--chart-1)" }]} />
      </GraficoCard>

      {enPeriodo.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <BarList title="Marcas que venden" description="Cuántos inscritos venden cada marca, en el período" items={contarPor(marcas, (x) => x.m)} />
          <BarList title="Regiones" description="Dónde venden, en el período" items={contarPor(enPeriodo, (r) => r.region, "Sin región")} />
        </div>
      )}

      <WaitlistVendedoresTable rows={enPeriodo} now={now} periodo={info} />
    </>
  );
}
