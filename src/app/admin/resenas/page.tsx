import { PageHeader } from "@/components/page-header";
import { ReviewsModeration } from "@/components/reviews-moderation";
import { getPendingReviews } from "@/lib/data/reviews-data";

export const dynamic = "force-dynamic";

export default async function ResenasPage() {
  const reviews = await getPendingReviews();

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <PageHeader
        title="Moderación de reseñas"
        subtitle={
          reviews.length === 0
            ? "No hay reseñas pendientes. Todo al día."
            : `${reviews.length} reseña${reviews.length === 1 ? "" : "s"} pendiente${reviews.length === 1 ? "" : "s"} — aprobá o rechazá una por una. Nada se publica solo.`
        }
      />
      <ReviewsModeration reviews={reviews} />
    </div>
  );
}
