import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getVendorSession, isActiveVendor } from "@/lib/auth/vendor";
import { VendedorShell } from "./vendedor-shell";

function BlockScreen({ title, body }: { title: string; body: string }) {
  return (
    <main className="bg-muted/30 flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black">
        <Logo size={26} />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 max-w-sm">{body}</p>
      </div>
      <form action="/auth/signout" method="post">
        <Button type="submit" variant="outline" className="cursor-pointer">
          Cerrar sesión
        </Button>
      </form>
    </main>
  );
}

export default async function VendedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getVendorSession();

  // Sin sesión → al login.
  if (session.status === "anon") redirect("/login?next=/vendedor");

  // Autenticado pero su email no está en leads_vendors.
  if (session.status === "no_registrado") {
    return (
      <BlockScreen
        title="Correo no registrado"
        body="No encontramos una cuenta de vendedor oficial con este correo. Si creés que es un error, contactá a Electrificarte."
      />
    );
  }

  // Vendedor sin suscripción activa.
  if (!isActiveVendor(session.vendor)) {
    return (
      <BlockScreen
        title="Cuenta no activa"
        body="Tu cuenta de vendedor oficial todavía no está activa. Una vez confirmada tu suscripción vas a poder entrar al panel."
      />
    );
  }

  const vendor = session.vendor;
  // Mostramos el nombre de la persona, no el del comercio (ese queda guardado y
  // editable en "Mi cuenta", pero no es lo relevante en la barra).
  const displayName =
    [vendor.nombre, vendor.apellido].filter(Boolean).join(" ") ||
    vendor.nombre_concesionario ||
    vendor.email ||
    "Vendedor";

  return (
    <VendedorShell
      user={{ name: displayName, role: "Vendedor oficial", email: vendor.email ?? undefined }}
    >
      {children}
    </VendedorShell>
  );
}
