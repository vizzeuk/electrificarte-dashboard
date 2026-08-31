import { AlertTriangle } from "lucide-react";
import { PoolTable } from "@/components/pool-table";
import { PageHeader } from "@/components/page-header";
import { getPoolLeads, getMisOfertas } from "@/lib/data/vendor-data";
import { leadRemaining } from "@/lib/utils";
import type { PoolLead } from "@/lib/db/types";

export const dynamic = "force-dynamic";

/** Los que cierran antes van primero; los sin fecha de cierre, al final. */
function porUrgencia(a: PoolLead, b: PoolLead): number {
  const ra = a.cierra_at ? new Date(a.cierra_at).getTime() : Infinity;
  const rb = b.cierra_at ? new Date(b.cierra_at).getTime() : Infinity;
  return ra - rb;
}

export default async function LeadsDisponiblesPage() {
  const [leads, misOfertas] = await Promise.all([getPoolLeads(), getMisOfertas()]);
  const ofertadosLeadIds = new Set(misOfertas.map((o) => o.lead_id));

  const ordenados = [...leads].sort(porUrgencia);
  // Leads que cierran en menos de 24 h y sobre los que este vendedor aún no ofertó.
  const porCerrar = ordenados.filter((l) => {
    if (ofertadosLeadIds.has(l.id)) return false;
    const u = leadRemaining(l.cierra_at)?.urgency;
    return u === "critico" || u === "urgente";
  }).length;

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <PageHeader
        title="Leads disponibles"
        subtitle={`Leads pagados disponibles para todos los vendedores oficiales — ${leads.length} para ofertar. Cualquiera puede ofertar; no hay asignación previa.`}
      />

      {porCerrar > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="size-5 shrink-0" />
          <p className="text-sm font-medium">
            {porCerrar === 1
              ? "1 lead cierra en menos de 24 h y todavía no ofertás. Ofertá antes de que se cierre la ventana."
              : `${porCerrar} leads cierran en menos de 24 h y todavía no ofertás. Ofertá antes de que se cierre la ventana.`}
          </p>
        </div>
      )}

      <PoolTable leads={ordenados} ofertadosLeadIds={ofertadosLeadIds} />
    </div>
  );
}
