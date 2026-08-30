import { PoolTable } from "@/components/pool-table";
import { getPoolLeads, getMisOfertas } from "@/lib/data/vendor-data";

export const dynamic = "force-dynamic";

export default async function LeadsDisponiblesPage() {
  const [leads, misOfertas] = await Promise.all([getPoolLeads(), getMisOfertas()]);
  const ofertadosLeadIds = new Set(misOfertas.map((o) => o.lead_id));

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads disponibles</h1>
        <p className="text-muted-foreground">
          Leads pagados disponibles para todos los vendedores oficiales —{" "}
          {leads.length} disponibles. Cualquiera puede ofertar; no hay asignación previa.
        </p>
      </div>
      <PoolTable leads={leads} ofertadosLeadIds={ofertadosLeadIds} />
    </div>
  );
}
