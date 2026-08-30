import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para el servidor (Server Components, Server Actions, Route
 * Handlers). Usa la anon key + las cookies de sesión del vendedor, por lo que
 * todas las lecturas quedan sujetas a RLS con la identidad del usuario logueado.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Llamado desde un Server Component: lo maneja el middleware al refrescar.
          }
        },
      },
    },
  );
}
