import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PdpSolicitudes } from "@/components/admin/pdp-solicitudes";
import { getAdminEmail } from "@/lib/auth/admin";
import { listarSolicitudes } from "@/lib/pdp-api";

export const dynamic = "force-dynamic";

/**
 * PDPs en creación: lo que se pidió desde "Nueva PDP" y en qué va la investigación.
 * La lista la sirve la web (`GET /api/admin/pdp/solicitudes`); el cliente la refresca cada 15 s
 * mientras haya alguna en curso.
 */
export default async function PdpsPage() {
  // El layout ya corta a quien no es admin, pero la página corre en paralelo: no se consulta
  // la web sin verificar acá también.
  if (!(await getAdminEmail())) notFound();
  const res = await listarSolicitudes({ limit: 100 });

  return (
    <>
      <PageHeader
        title="PDPs en creación"
        subtitle="Cada ficha nueva la investiga el agente y nace oculta en Studio. Ninguna se publica sola: eso lo hace siempre una persona."
        actions={
          <Button asChild>
            <Link href="/admin/pdps/nueva">
              <Plus strokeWidth={1.5} aria-hidden /> Nueva PDP
            </Link>
          </Button>
        }
      />
      <PdpSolicitudes inicial={res.ok ? res.data : []} errorInicial={res.ok ? undefined : res.errores[0]} now={Date.now()} />
    </>
  );
}
