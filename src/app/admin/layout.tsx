import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

/** No se guarda un nombre por admin: la cuenta suele ser un correo compartido (contacto@…). */
const GENERICOS = ["contacto", "admin", "hola", "info", "equipo"];
function nombreAdmin(email: string | undefined): string {
  const local = (email ?? "").split("@")[0].split(/[._+-]/)[0].toLowerCase();
  if (!local || GENERICOS.includes(local)) return "Equipo Electrificarte";
  return local.charAt(0).toLocaleUpperCase("es-CL") + local.slice(1);
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  // Autenticado pero sin permisos de admin.
  if (!isAdminEmail(user.email)) {
    return (
      <main className="bg-muted flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
        <Logo className="h-5" />
        <div>
          <h1 className="font-display text-h3 font-bold">Acceso restringido</h1>
          <p className="text-muted-foreground mt-2 max-w-sm">
            Esta sección es solo para el equipo de Electrificarte.
          </p>
        </div>
        <form action="/auth/signout" method="post">
          <Button type="submit" variant="outline" className="cursor-pointer">
            Cerrar sesión
          </Button>
        </form>
      </main>
    );
  }

  return (
    <AdminShell user={{ name: nombreAdmin(user.email), role: "Administración", email: user.email }}>
      {children}
    </AdminShell>
  );
}
