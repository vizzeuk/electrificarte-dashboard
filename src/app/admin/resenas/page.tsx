import { PageHeader, SectionTitle } from "@/components/page-header";
import { Kpi, Kpis } from "@/components/kpi";
import { ReviewsModeration } from "@/components/reviews-moderation";
import { ReviewsTable } from "@/components/reviews-table";
import { getAllReviews, getPendingReviews } from "@/lib/data/reviews-data";
import { formatNumero } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Regla (sep-2026): solo se moderan las reseñas CON fotos, porque lo que puede ser inapropiado
 * es la imagen. Las que llegan solo con texto se publican solas y aparecen en "Todas las reseñas".
 */
export default async function ResenasPage() {
  const [pendientes, todas] = await Promise.all([getPendingReviews(), getAllReviews()]);
  const now = Date.now();
  const publicadas = todas.filter((r) => r.status === "aprobada").length;
  const rechazadas = todas.filter((r) => r.status === "rechazada").length;
  const notas = todas.map((r) => r.rating).filter((n): n is number => n != null && n > 0);
  const promedio = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null;

  return (
    <>
      <PageHeader
        title="Reseñas"
        subtitle="Las reseñas con fotos se revisan antes de publicarse. Las que llegan sin fotos se publican solas."
      />

      <Kpis>
        <Kpi value={formatNumero(pendientes.length)} label="Por moderar" />
        <Kpi value={formatNumero(publicadas)} label="Publicadas" />
        <Kpi value={formatNumero(rechazadas)} label="Rechazadas" />
        <Kpi
          value={promedio == null ? "Sin notas" : promedio.toLocaleString("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          label="Nota promedio"
          hint={`De las últimas ${formatNumero(todas.length)} reseñas`}
        />
      </Kpis>

      <section className="flex flex-col gap-4">
        <SectionTitle
          title="Por moderar"
          description={
            pendientes.length === 0
              ? "Nada pendiente por ahora."
              : `${formatNumero(pendientes.length)} reseña${pendientes.length === 1 ? "" : "s"} esperando revisión, de la más antigua a la más nueva.`
          }
        />
        <ReviewsModeration reviews={pendientes} />
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle title="Todas las reseñas" description="Las más recientes de cualquier estado." />
        <ReviewsTable reviews={todas} now={now} />
      </section>
    </>
  );
}
