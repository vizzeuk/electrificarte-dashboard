import { PageHeader } from "@/components/page-header";
import { ReviewsModeration } from "@/components/reviews-moderation";
import { ReviewsTable } from "@/components/reviews-table";
import { getAllReviews, getPendingReviews } from "@/lib/data/reviews-data";

export const dynamic = "force-dynamic";

/**
 * Regla (sep-2026): solo se moderan las reseñas CON fotos, porque lo que puede ser inapropiado
 * es la imagen. Las que llegan solo con texto se publican solas y aparecen en "Todas las reseñas".
 */
export default async function ResenasPage() {
  const [pendientes, todas] = await Promise.all([getPendingReviews(), getAllReviews()]);

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <PageHeader
        title="Reseñas"
        subtitle={
          pendientes.length === 0
            ? "No hay reseñas con fotos por moderar. Las que llegan sin fotos se publican solas."
            : `${pendientes.length} reseña${pendientes.length === 1 ? "" : "s"} con fotos por moderar. Las que llegan sin fotos se publican solas.`
        }
      />
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Por moderar</h2>
        <ReviewsModeration reviews={pendientes} />
      </section>
      <section className="flex flex-col gap-4">
        <h2 className="font-display text-xl font-semibold">Todas las reseñas</h2>
        <ReviewsTable reviews={todas} />
      </section>
    </div>
  );
}
