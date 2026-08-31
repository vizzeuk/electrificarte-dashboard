import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { PREVIEW_MODE } from "@/lib/mock/preview";

export const dynamic = "force-dynamic";

/**
 * Entrada única: rutea por rol. Ya no hay "switch de vistas".
 *  - sin sesión        → /login
 *  - admin (allowlist) → /admin
 *  - vendedor          → /vendedor
 */
export default async function Home() {
  if (PREVIEW_MODE) redirect("/vendedor"); // PREVIEW_MODE: sin sesión, entrar al panel vendedor
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (isAdminEmail(user.email)) redirect("/admin");
  redirect("/vendedor");
}
