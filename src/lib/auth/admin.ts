import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Allowlist de correos con acceso al panel admin (env ADMIN_EMAILS). */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

/**
 * Correo del admin logueado, o null si no hay sesión o no está en la allowlist.
 */
export async function getAdminEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return isAdminEmail(user?.email) ? user!.email! : null;
}
