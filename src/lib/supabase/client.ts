import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para el navegador (Client Components).
 * Usa SOLO la anon key. La seguridad la impone RLS + la sesión del vendedor.
 * Nunca importar acá el service role.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
