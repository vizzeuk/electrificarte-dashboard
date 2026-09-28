import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { CifraKpi } from "@/components/cifra-kpi";
import { GraficoCard } from "@/components/grafico-card";
import { PeriodoSelector } from "@/components/periodo-selector";
import { SerieChart } from "@/components/serie-chart";
import { BarList, contarPor } from "@/components/bar-list";
import { VendedoresTable } from "@/components/admin/vendedores-table";
import { getVendedores } from "@/lib/data/admin-data";
import { parseMarcas } from "@/lib/marcas";
import { AGRUPACIONES, enActual, infoPeriodo, resolverPeriodo } from "@/lib/periodo";
import { cerrarPeriodo, cifraConteo, contarPorTramo } from "@/lib/series";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

export default async function VendedoresPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const now = Date.now();
  const p0 = resolverPeriodo(sp, now);
  // La red es chica (decenas) y la cobertura de hoy (activos, regiones, marcas) mira a todos:
  // se lee completa y el período se aplica acá.
  const vendedores = await getVendedores();
  const { p, tramos } = cerrarPeriodo(sp, now, p0, vendedores.map((v) => v.created_at));
  const info = infoPeriodo(p);
  const por = AGRUPACIONES.find((a) => a.key === p.agrupar)!.porLabel;

  const registrados = cifraConteo(vendedores.map((v) => v.created_at), p);
  const activos = vendedores.filter((v) => (v.estado ?? "").toLowerCase() === "activo").length;
  const regiones = new Set(vendedores.map((v) => v.region?.trim()).filter(Boolean)).size;
  const marcas = vendedores.flatMap((v) => parseMarcas(v.marcas).map((m) => ({ m })));
  const enPeriodo = vendedores.filter((v) => enActual(v.created_at, p));

  return (
    <>
      <PageHeader
        title="Vendedores"
        subtitle="Red de vendedores oficiales registrados en la plataforma de vendedores."
        actions={<PeriodoSelector key={JSON.stringify(info)} periodo={info} />}
        className="sm:items-start"
      />

      <Kpis>
        <CifraKpi label="Registros nuevos" cifra={registrados} comparacion={p.comparacion} />
        <Kpi value={formatNumero(activos)} label="Activos hoy" hint={`${formatNumero(vendedores.length)} ${vendedores.length === 1 ? "registrado" : "registrados"}`} />
        <Kpi value={formatNumero(regiones)} label="Regiones con cobertura" />
        <Kpi value={formatNumero(new Set(marcas.map((x) => x.m)).size)} label="Marcas que ofrecen" />
      </Kpis>

      <GraficoCard title="Registros en el tiempo" description={`${p.etiqueta}, ${por}`}>
        <SerieChart tramos={tramos} series={[{ key: "registros", label: "Registros", data: contarPorTramo(vendedores.map((v) => v.created_at), tramos, p), color: "var(--chart-1)" }]} />
      </GraficoCard>

      {vendedores.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <BarList title="Marcas en la red" description="Cuántos vendedores ofrecen cada marca (toda la red)" items={contarPor(marcas, (x) => x.m)} />
          <BarList title="Regiones" description="Dónde están los vendedores (toda la red)" items={contarPor(vendedores, (v) => v.region, "Sin región")} />
        </div>
      )}

      <VendedoresTable rows={enPeriodo} now={now} periodo={info} />
    </>
  );
}
