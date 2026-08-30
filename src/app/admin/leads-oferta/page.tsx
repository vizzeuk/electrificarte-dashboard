import { ShoppingBag, Handshake, CheckCircle2, Clock } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { LeadsOfertaTable } from "@/components/leads-oferta-table";
import { leadsOferta } from "@/lib/mock/leads-oferta";

export default function LeadsOfertaPage() {
  const pendientes = leadsOferta.filter((l) => l.estado === "pendiente").length;
  const enProceso = leadsOferta.filter((l) => l.estado === "pagado" || l.estado === "contactado").length;
  const cerrados = leadsOferta.filter((l) => l.estado === "cerrado").length;

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Leads Oferta Exclusiva — $19.990</h1>
        <p className="text-muted-foreground">Personas que ya decidieron su auto y esperan la mejor oferta de la red de vendedores.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total" value={String(leadsOferta.length)} icon={ShoppingBag} accent="primary" />
        <KpiCard label="Sin pagar" value={String(pendientes)} icon={Clock} accent="amber" />
        <KpiCard label="En proceso" value={String(enProceso)} icon={Handshake} accent="muted" hint="Pagado o contactado" />
        <KpiCard label="Cerrados" value={String(cerrados)} icon={CheckCircle2} accent="green" />
      </div>

      <LeadsOfertaTable leads={leadsOferta} />
    </div>
  );
}
