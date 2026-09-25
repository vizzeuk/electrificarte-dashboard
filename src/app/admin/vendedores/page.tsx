import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { BarList, contarPor } from "@/components/bar-list";
import { VendedoresTable } from "@/components/admin/vendedores-table";
import { getVendedores } from "@/lib/data/admin-data";
import { parseMarcas } from "@/lib/marcas";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function VendedoresPage() {
  const vendedores = await getVendedores();
  const now = Date.now();
  const activos = vendedores.filter((v) => (v.estado ?? "").toLowerCase() === "activo").length;
  const regiones = new Set(vendedores.map((v) => v.region?.trim()).filter(Boolean)).size;
  const marcas = vendedores.flatMap((v) => parseMarcas(v.marcas).map((m) => ({ m })));

  return (
    <>
      <PageHeader
        title="Vendedores"
        subtitle="Red de vendedores oficiales registrados en la plataforma de vendedores."
      />

      <Kpis>
        <Kpi value={formatNumero(activos)} label="Activos" hint={`${formatNumero(vendedores.length)} ${vendedores.length === 1 ? "registrado" : "registrados"}`} />
        <Kpi value={formatNumero(regiones)} label="Regiones con cobertura" />
        <Kpi value={formatNumero(new Set(marcas.map((x) => x.m)).size)} label="Marcas que ofrecen" />
        <Kpi value={formatNumero(vendedores.reduce((s, v) => s + v.ofertas, 0))} label="Ofertas enviadas" hint="Histórico, antes de la pausa" />
      </Kpis>

      {vendedores.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <BarList title="Marcas en la red" description="Cuántos vendedores ofrecen cada marca" items={contarPor(marcas, (x) => x.m)} />
          <BarList title="Regiones" description="Dónde están los vendedores" items={contarPor(vendedores, (v) => v.region, "Sin región")} />
        </div>
      )}

      <VendedoresTable rows={vendedores} now={now} />
    </>
  );
}
