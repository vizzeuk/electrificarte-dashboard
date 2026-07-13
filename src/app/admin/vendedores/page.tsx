import { Store, Handshake, Trophy, Percent } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { VendedoresTable } from "@/components/vendedores-table";
import { vendedores } from "@/lib/mock/vendedores";
import { vendedoresActivos, totalLeadsOfertados, tasaRespuestaPromedio } from "@/lib/mock/derived";

export default function VendedoresPage() {
  const activos = vendedoresActivos();
  const totalGanados = vendedores.reduce((sum, v) => sum + v.leadsGanados, 0);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendedores</h1>
        <p className="text-muted-foreground">
          Red de vendedores oficiales — usa estos KPIs para diseñar incentivos por desempeño.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Vendedores activos" value={String(activos.length)} icon={Store} accent="primary" hint={`${vendedores.length} en total`} />
        <KpiCard label="Leads ofertados" value={String(totalLeadsOfertados())} icon={Handshake} accent="amber" hint="Acumulado" />
        <KpiCard label="Leads ganados" value={String(totalGanados)} icon={Trophy} accent="green" />
        <KpiCard label="Tasa de respuesta prom." value={`${tasaRespuestaPromedio()}%`} icon={Percent} accent="muted" />
      </div>

      <VendedoresTable vendedores={vendedores} />
    </div>
  );
}
