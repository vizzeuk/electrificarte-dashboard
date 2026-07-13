import Link from "next/link";
import { Store, ShieldCheck, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const views = [
  {
    href: "/vendedor",
    icon: Store,
    title: "Vista Vendedor",
    description:
      "Leads activos, leads disponibles para ofertar y tráfico del sitio relevante para vendedores.",
  },
  {
    href: "/admin",
    icon: ShieldCheck,
    title: "Vista Administrador",
    description:
      "Analítica de tráfico del sitio, leads de Asesoría y Oferta, y vendedores activos con sus KPIs.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-16">
      <div className="w-full max-w-3xl">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black mb-4">
            <Logo size={26} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Electrificarte</h1>
          <p className="text-muted-foreground mt-2 max-w-md">
            Elige qué vista quieres revisar. Todos los datos de esta demo son simulados.
          </p>
          <Badge variant="outline" className="mt-4">
            Datos de prueba — sin conexión a producción
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {views.map((v) => (
            <Link key={v.href} href={v.href}>
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent/40 cursor-pointer">
                <CardHeader>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                    <v.icon className="size-5" />
                  </div>
                  <CardTitle className="text-lg">{v.title}</CardTitle>
                  <CardDescription>{v.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Entrar <ArrowRight className="size-4" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
