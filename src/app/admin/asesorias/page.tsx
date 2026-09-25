import { Sparkles, MessageCircle, CheckCircle2, Clock } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { LeadsAsesoriaTable } from "@/components/leads-asesoria-table";
import { leadsAsesoria } from "@/lib/mock/leads-asesoria";

export default function LeadsAsesoriaPage() {
  const pendientes = leadsAsesoria.filter((l) => l.estado === "pendiente").length;
  const enConversacion = leadsAsesoria.filter((l) => l.estado === "en_conversacion").length;
  const cerrados = leadsAsesoria.filter((l) => l.estado === "cerrado").length;

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Leads Asesoría IA — $4.990</h1>
        <p className="text-muted-foreground">Personas que contrataron la asesoría por WhatsApp con Francisco IA.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total" value={String(leadsAsesoria.length)} icon={Sparkles} accent="primary" />
        <KpiCard label="Sin iniciar" value={String(pendientes)} icon={Clock} accent="amber" />
        <KpiCard label="En conversación" value={String(enConversacion)} icon={MessageCircle} accent="muted" />
        <KpiCard label="Cerrados" value={String(cerrados)} icon={CheckCircle2} accent="green" hint="Avanzaron o cerraron" />
      </div>

      <LeadsAsesoriaTable leads={leadsAsesoria} />
    </div>
  );
}
