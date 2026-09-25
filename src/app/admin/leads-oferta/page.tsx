import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { LeadsOfertaTable } from "@/components/admin/leads-oferta-table";
import { Badge } from "@/components/ui/badge";
import { getLeadsOferta } from "@/lib/data/admin-data";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeadsOfertaPage() {
  const leads = await getLeadsOferta();
  const now = Date.now();
  const pagados = leads.filter((l) => (l.status ?? "").toLowerCase() === "pagado").length;
  const prueba = leads.filter((l) => (l.origen ?? "").toLowerCase().includes("test")).length;
  const conOfertas = leads.filter((l) => l.ofertas > 0).length;

  return (
    <>
      <PageHeader
        chips={<Badge variant="default">En pausa</Badge>}
        title="Leads Oferta Exclusiva"
        subtitle="Producto en pausa desde septiembre de 2026: no entran leads nuevos. Se muestran los registros históricos solo para consulta."
      />

      <Kpis>
        <Kpi value={formatNumero(leads.length)} label="Leads registrados" />
        <Kpi value={formatNumero(pagados)} label="Pagados" />
        <Kpi value={formatNumero(conOfertas)} label="Con ofertas de vendedores" />
        <Kpi value={formatNumero(prueba)} label="De prueba" hint="Origen marcado como test" />
      </Kpis>

      <LeadsOfertaTable rows={leads} now={now} />
    </>
  );
}
