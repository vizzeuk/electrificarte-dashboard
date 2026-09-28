import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminEmail } from "@/lib/auth/admin";
import { faltaEsquema } from "@/lib/data/admin-data";

/**
 * Categorías de la reseña (migración del 27-sep-2026): Autonomía, Confort, Agilidad y Calidad,
 * de 1 a 5, y la nota final (`rating`) es su promedio con un decimal. Las reseñas antiguas no
 * las tienen (quedan null). Si la migración todavía no está aplicada, las consultas se repiten
 * sin estas columnas y todo sigue funcionando.
 */
export const CATEGORIAS = [
  { key: "rating_autonomia", label: "Autonomía" },
  { key: "rating_confort", label: "Confort" },
  { key: "rating_agilidad", label: "Agilidad" },
  { key: "rating_calidad", label: "Calidad" },
] as const;

export type CategoriaKey = (typeof CATEGORIAS)[number]["key"];

export interface CamposNuevos {
  rating_autonomia: number | null;
  rating_confort: number | null;
  rating_agilidad: number | null;
  rating_calidad: number | null;
  pros: string | null;
  contras: string | null;
}

const COLS_NUEVAS = "rating_autonomia, rating_confort, rating_agilidad, rating_calidad, pros, contras";

/** numeric llega como string desde PostgREST: todo a number (o null). */
function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function normalizar<T extends Record<string, unknown>>(r: T): T & CamposNuevos & { rating: number | null } {
  return {
    ...r,
    rating: num(r.rating),
    rating_autonomia: num(r.rating_autonomia),
    rating_confort: num(r.rating_confort),
    rating_agilidad: num(r.rating_agilidad),
    rating_calidad: num(r.rating_calidad),
    pros: (r.pros as string | null | undefined)?.trim() || null,
    contras: (r.contras as string | null | undefined)?.trim() || null,
  };
}

/**
 * Corre la consulta con las columnas nuevas; si fallan porque no existen todavía, la repite
 * con las de siempre. `build` recibe la lista de columnas.
 */
async function conColumnasNuevas<R>(
  base: string,
  build: (cols: string) => PromiseLike<{ data: unknown; error: { code?: string; message: string } | null }>,
): Promise<{ data: R[] | null; error: { message: string } | null }> {
  let r = await build(`${base}, ${COLS_NUEVAS}`);
  if (r.error && faltaEsquema(r.error)) r = await build(base);
  return { data: (r.data as R[] | null) ?? null, error: r.error };
}

/** Reseña pendiente de moderar. Incluye PII (email/teléfono): SOLO se usa en la vista admin,
 *  nunca se publica ni llega a la vista de vendedor. */
export interface PendingReview extends CamposNuevos {
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
  const { data, error } = await conColumnasNuevas<Record<string, unknown> & { photos: string[] | null }>(
    "id, created_at, first_name, last_name, email, phone, rating, body, car_slug, car_brand, car_model, car_year, car_color, car_version, photos, source",
    (cols) => db.from("reviews").select(cols).eq("status", "pendiente").order("created_at", { ascending: true }),
  );

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
      return { ...normalizar(rest), fotos } as unknown as PendingReview;
    }),
  );
}

/** Fila de la lista completa (sin PII sensible más allá del nombre: la vista es admin-only). */
export interface ReviewRow extends CamposNuevos {
  id: string;
  created_at: string | null;
  first_name: string | null;
  last_name: string | null;
  rating: number | null;
  body: string | null;
  car_slug: string | null;
  car_brand: string | null;
  car_model: string | null;
  status: "pendiente" | "aprobada" | "rechazada" | string;
  fotos: number;
  /** true = aprobada sin pasar por moderación (reseña sin fotos, regla de sep-2026). */
  auto: boolean;
  moderated_by: string | null;
  moderated_at: string | null;
}

/**
 * TODAS las reseñas desde `desde` (creadas o moderadas en el período), cualquier estado, más
 * nuevas primero. Sin `desde`, todas (con tope).
 *
 * Regla (sep-2026, Vicente + Matías): solo se moderan las reseñas CON fotos. Las que llegan solo
 * con texto las publica n8n directamente (status 'aprobada', sin moderated_at). Esta lista las
 * muestra todas para que Francisco vea lo que entra; aprobar/rechazar sigue siendo solo para la
 * cola de pendientes (getPendingReviews).
 */
export async function getAllReviews(desde: number | null = null, limit = 5000): Promise<ReviewRow[]> {
  if (!(await getAdminEmail())) return [];

  const db = createServiceClient();
  const { data, error } = await conColumnasNuevas<Record<string, unknown> & { photos: string[] | null; moderated_at: string | null; status: string }>(
    "id, created_at, first_name, last_name, rating, body, car_slug, car_brand, car_model, status, photos, moderated_at, moderated_by",
    (cols) => {
      let q = db.from("reviews").select(cols).order("created_at", { ascending: false }).limit(limit);
      if (desde != null) {
        const d = new Date(desde).toISOString();
        q = q.or(`created_at.gte.${d},moderated_at.gte.${d}`);
      }
      return q;
    },
  );

  if (error) {
    console.error("getAllReviews:", error.message);
    return [];
  }

  return (data ?? []).map((r) => {
    const photos: string[] = r.photos ?? [];
    // Las fotos se guardan en pares (-card / -full): una foto = 2 archivos.
    const fotos = Math.floor(photos.length / 2) || photos.length;
    const { photos: _p, ...rest } = r;
    void _p;
    return { ...normalizar(rest), fotos, auto: r.status === "aprobada" && !r.moderated_at && photos.length === 0 } as unknown as ReviewRow;
  });
}

/** Reseñas esperando moderación hoy (conteo, sin traer filas). */
export async function contarPorModerar(): Promise<number> {
  if (!(await getAdminEmail())) return 0;
  const { count, error } = await createServiceClient()
    .from("reviews")
    .select("id", { count: "exact", head: true })
    .eq("status", "pendiente");
  if (error) console.error("contarPorModerar:", error.message);
  return count ?? 0;
}
