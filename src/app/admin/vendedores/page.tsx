import { Store, Handshake, Trophy } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { AdminVendedoresTable } from "@/components/admin-vendedores-table";
import { getVendedores } from "@/lib/data/admin-data";

export const dynamic = "force-dynamic";

export default async function VendedoresPage() {
  const vendedores = await getVendedores();
  const activos = vendedores.filter((v) => (v.estado ?? "").toLowerCase() === "activo").length;
  const totalOfertas = vendedores.reduce((s, v) => s + v.ofertas, 0);
  const totalGanadas = vendedores.reduce((s, v) => s + v.ganadas, 0);

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <PageHeader
        title="Vendedores"
        subtitle="Red de vendedores oficiales — usá estos KPIs para diseñar incentivos por desempeño."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Vendedores activos" value={String(activos)} icon={Store} accent="primary" hint={`${vendedores.length} en total`} />
        <KpiCard label="Ofertas enviadas" value={String(totalOfertas)} icon={Handshake} accent="amber" hint="Acumulado de la red" />
        <KpiCard label="Ofertas ganadas" value={String(totalGanadas)} icon={Trophy} accent="green" />
      </div>

      <AdminVendedoresTable vendedores={vendedores} />
    </div>
  );
}
