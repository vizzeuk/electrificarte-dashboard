import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getVendorSession, isActiveVendor } from "@/lib/auth/vendor";
import { VendedorShell } from "./vendedor-shell";

function BlockScreen({ title, body }: { title: string; body: string }) {
  return (
    <main className="bg-muted flex min-h-screen flex-col items-center justify-center gap-6 px-5 text-center">
      <Logo className="h-5" />
      <div>
        <h1 className="font-display text-h3 font-bold">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">{body}</p>
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
        body="No encontramos una cuenta de vendedor oficial con este correo. Si crees que es un error, escríbenos a contacto@electrificarte.com."
      />
    );
  }

  // Vendedor sin suscripción activa.
  if (!isActiveVendor(session.vendor)) {
    return (
      <BlockScreen
        title="Cuenta no activa"
        body="Tu cuenta de vendedor oficial todavía no está activa. Cuando se confirme tu suscripción podrás entrar al panel."
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
