import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminEmail } from "@/lib/auth/admin";

/** Reseña pendiente de moderar. Incluye PII (email/teléfono): SOLO se usa en la vista admin,
 *  nunca se publica ni llega a la vista de vendedor. */
export interface PendingReview {
  id: string;
  created_at: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  rating: number | null;
  body: string | null;
  car_slug: string | null;
  car_brand: string | null;
  car_model: string | null;
  car_year: string | null;
  car_color: string | null;
  car_version: string | null;
  source: string | null;
  /** Signed URLs (1 h) de las fotos en tamaño grande, listas para mostrar. */
  fotos: string[];
}

const BUCKET_PENDIENTE = "review-media-pendiente";
const SIGNED_TTL = 60 * 60; // 1 h — suficiente para una sesión de moderación.

/**
 * Cola de reseñas pendientes, más antiguas primero. Las fotos viven en un bucket privado, así
 * que se firman con service role (createSignedUrl) para poder verlas sin exponer el bucket.
 * Admin-only: si no hay sesión de admin, devuelve vacío.
 */
export async function getPendingReviews(): Promise<PendingReview[]> {
  if (!(await getAdminEmail())) return [];

  const db = createServiceClient();
  const { data, error } = await db
    .from("reviews")
    .select(
      "id, created_at, first_name, last_name, email, phone, rating, body, car_slug, car_brand, car_model, car_year, car_color, car_version, photos, source",
    )
    .eq("status", "pendiente")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPendingReviews:", error.message);
    return [];
  }

  return Promise.all(
    (data ?? []).map(async (r) => {
      // Las fotos vienen en pares -card.jpg / -full.jpg; para moderar usamos las grandes.
      const todas: string[] = r.photos ?? [];
      const full = todas.filter((p) => p.includes("-full"));
      const paths = full.length ? full : todas;

      let fotos: string[] = [];
      if (paths.length) {
        const { data: signed, error: sErr } = await db.storage
          .from(BUCKET_PENDIENTE)
          .createSignedUrls(paths, SIGNED_TTL);
        if (sErr) console.error("getPendingReviews/signed:", sErr.message);
        fotos = (signed ?? []).map((s) => s.signedUrl).filter((u): u is string => !!u);
      }

      const { photos: _photos, ...rest } = r;
      void _photos;
      return { ...rest, fotos } as PendingReview;
    }),
  );
}
