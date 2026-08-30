import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con SERVICE ROLE — bypassa RLS. SOLO server-side, para
 * escrituras con reglas de negocio (p. ej. insertar la puja validando la sesión).
 *
 * El import "server-only" hace fallar el build si esto se importa desde el browser.
 * NUNCA prefijar la key con NEXT_PUBLIC_ ni pasarla a un Client Component.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
