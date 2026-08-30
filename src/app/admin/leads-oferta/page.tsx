import { ShoppingBag, Car, MapPin } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { AdminLeadsTable } from "@/components/admin-leads-table";
import { getLeadsOferta } from "@/lib/data/admin-data";

export const dynamic = "force-dynamic";

export default async function LeadsOfertaPage() {
  const leads = await getLeadsOferta();
  const conModelo = leads.filter((l) => !!l.target_model).length;
  const regiones = new Set(leads.map((l) => l.region).filter(Boolean)).size;

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <PageHeader
        title="Leads Oferta Exclusiva — $19.990"
        subtitle="Personas que ya decidieron su auto y esperan la mejor oferta de la red de vendedores."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label="Leads pagados" value={String(leads.length)} icon={ShoppingBag} accent="primary" />
        <KpiCard label="Con modelo definido" value={String(conModelo)} icon={Car} accent="green" />
        <KpiCard label="Regiones" value={String(regiones)} icon={MapPin} accent="muted" hint="Cobertura" />
      </div>

      <AdminLeadsTable leads={leads} />
    </div>
  );
}
