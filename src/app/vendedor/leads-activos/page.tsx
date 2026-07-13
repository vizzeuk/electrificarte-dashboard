import { LeadsOfertaTable } from "@/components/leads-oferta-table";
import { leadsActivosVendedor } from "@/lib/mock/derived";

export default function LeadsActivosPage() {
  const leads = leadsActivosVendedor();

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads activos</h1>
        <p className="text-muted-foreground">
          Leads que ya te fueron asignados — {leads.length} en total.
        </p>
      </div>
      <LeadsOfertaTable leads={leads} />
    </div>
  );
}
