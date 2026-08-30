import { PoolTable } from "@/components/pool-table";
import { PageHeader } from "@/components/page-header";
import { getPoolLeads, getMisOfertas } from "@/lib/data/vendor-data";

export const dynamic = "force-dynamic";

export default async function LeadsDisponiblesPage() {
  const [leads, misOfertas] = await Promise.all([getPoolLeads(), getMisOfertas()]);
  const ofertadosLeadIds = new Set(misOfertas.map((o) => o.lead_id));

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <PageHeader
        title="Leads disponibles"
        subtitle={`Leads pagados disponibles para todos los vendedores oficiales — ${leads.length} para ofertar. Cualquiera puede ofertar; no hay asignación previa.`}
      />
      <PoolTable leads={leads} ofertadosLeadIds={ofertadosLeadIds} />
    </div>
  );
}
