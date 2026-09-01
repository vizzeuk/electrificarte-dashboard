import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin";
import { AdminShell } from "./admin-shell";

export const dynamic = "force-dynamic";

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
      <main className="bg-muted/30 flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black">
          <Logo size={26} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Acceso restringido</h1>
          <p className="text-muted-foreground mt-1 max-w-sm">
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
    <AdminShell user={{ name: "Francisco", role: "Administrador", email: user.email }}>
      {children}
    </AdminShell>
  );
}
