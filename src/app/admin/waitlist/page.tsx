import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { BarList, contarPor } from "@/components/bar-list";
import { WaitlistTable } from "@/components/admin/waitlist-table";
import { getWaitlist } from "@/lib/data/admin-data";
import { fuenteLabel } from "@/lib/labels";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DIA = 86_400_000;

export default async function WaitlistPage() {
  const rows = await getWaitlist();
  const now = Date.now();
  const personas = rows.filter((r) => r.ultima);
  const nuevas = (dias: number) =>
    personas.filter((r) => r.created_at && now - new Date(r.created_at).getTime() <= dias * DIA).length;
  const sinContactar = personas.filter((r) => !r.contacted).length;
  const duplicadas = rows.length - personas.length;

  return (
    <>
      <PageHeader
        title="Waitlist"
        subtitle="Personas que dejaron sus datos para recibir ofertas de autos. Es la base de demanda que se le ofrecerá a la red de vendedores oficiales."
      />

      <Kpis>
        <Kpi value={formatNumero(personas.length)} label="Personas en la waitlist" hint={duplicadas > 0 ? `${formatNumero(rows.length)} inscripciones, ${formatNumero(duplicadas)} repetidas` : "Sin inscripciones repetidas"} />
        <Kpi value={formatNumero(nuevas(7))} label="Nuevas en 7 días" />
        <Kpi value={formatNumero(nuevas(30))} label="Nuevas en 30 días" />
        <Kpi value={formatNumero(sinContactar)} label="Sin contactar" />
      </Kpis>

      {rows.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          <BarList
            title="De dónde llegan"
            description="Botón o sección del sitio desde donde se inscribieron"
            items={contarPor(personas, (r) => fuenteLabel(r.source))}
          />
          <BarList
            title="Modelos que más piden"
            description="Auto de interés que dejaron al inscribirse (opcional)"
            items={contarPor(personas, (r) => r.model, "No indicó modelo")}
          />
        </div>
      )}

      <WaitlistTable rows={rows} now={now} />
    </>
  );
}
