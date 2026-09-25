import { PageHeader } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { FeedbackTable } from "@/components/admin/feedback-table";
import { getRatings } from "@/lib/data/admin-data";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
  const rows = await getRatings();
  const now = Date.now();
  const notas = rows.map((r) => r.stars).filter((s): s is number => s != null && s > 0);
  const promedio = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;
  const conComentario = rows.filter((r) => r.feedback?.trim()).length;
  const bajas = notas.filter((n) => n <= 2).length;

  return (
    <>
      <PageHeader title="Feedback del sitio" subtitle="Calificaciones y comentarios que dejan las personas con el botón “Tu opinión” del sitio." />
      <Kpis>
        <Kpi
          value={promedio == null ? "Sin notas" : promedio.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          label="Nota promedio"
          hint="De 1 a 5 estrellas"
        />
        <Kpi value={formatNumero(rows.length)} label="Calificaciones" />
        <Kpi value={formatNumero(conComentario)} label="Con comentario" />
        <Kpi value={formatNumero(bajas)} label="Notas de 1 o 2" hint="Conviene leerlas primero" />
      </Kpis>
      <FeedbackTable rows={rows} now={now} />
    </>
  );
}
