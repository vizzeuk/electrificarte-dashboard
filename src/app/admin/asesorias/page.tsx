import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { AsesoriasTable } from "@/components/admin/asesorias-table";
import { ASESORIA_DIAS, getAsesorias } from "@/lib/data/admin-data";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AsesoriasPage() {
  const { rows, fuente } = await getAsesorias();
  const now = Date.now();
  const activas = rows.filter((r) => r.estado === "activa");
  const vencenPronto = activas.filter((r) => r.dias_restantes <= 2).length;
  const pagadas = rows.filter((r) => r.estado === "activa" || r.estado === "vencida").length;
  const pendientes = rows.filter((r) => r.estado === "pendiente de pago").length;

  return (
    <>
      <PageHeader
        title="Asesorías"
        subtitle={`Personas que contrataron la asesoría por WhatsApp ($4.990). Dura ${ASESORIA_DIAS} días desde el pago.`}
      />

      <Kpis>
        <Kpi value={formatNumero(activas.length)} label="Activas hoy" hint={vencenPronto > 0 ? `${formatNumero(vencenPronto)} vencen en 2 días o menos` : "Ninguna por vencer"} />
        <Kpi value={formatNumero(pagadas)} label="Pagadas en total" hint="Activas y vencidas" />
        <Kpi value={formatNumero(pendientes)} label="Pago pendiente" hint="Llenaron el formulario y no pagaron" />
        <Kpi value={formatNumero(rows.length)} label="Formularios recibidos" />
      </Kpis>

      <AsesoriasTable rows={rows} now={now} />

      <p className="text-muted-foreground text-small">
        {fuente === "vista"
          ? "Estado y días restantes según la vista asesorias_estado de Supabase."
          : `Estado y días restantes calculados con la misma regla del bot: ${ASESORIA_DIAS} días desde el pago (o desde el formulario si falta la fecha de pago).`}
      </p>
    </>
  );
}
