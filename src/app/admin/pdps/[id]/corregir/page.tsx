import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PdpForm } from "@/components/admin/pdp-form";
import { ErrorOpciones } from "@/components/admin/pdp-error";
import { getAdminEmail } from "@/lib/auth/admin";
import { obtenerOpciones, obtenerSolicitud } from "@/lib/pdp-api";
import { accionesDe, estadoInfo, nombrePdp } from "@/lib/pdp";

export const dynamic = "force-dynamic";

/** "Corregir y reintentar": el formulario precargado; se manda solo lo que cambió. */
export default async function CorregirPdpPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminEmail())) notFound();
  const { id } = await params;
  const [opciones, sol] = await Promise.all([obtenerOpciones(), obtenerSolicitud(id)]);

  if (!sol.ok) return <><PageHeader title="Corregir y reintentar" /><ErrorOpciones mensaje={sol.errores[0]} /></>;
  if (!opciones.ok) return <><PageHeader title="Corregir y reintentar" /><ErrorOpciones mensaje={opciones.errores[0]} /></>;

  const s = sol.data;
  const info = estadoInfo(s.estado);
  const corregible = accionesDe(s, Date.now()).corregir;

  return (
    <>
      <PageHeader
        title="Corregir y reintentar"
        subtitle={`${nombrePdp(s)}. Cambia lo que estaba mal (casi siempre es la URL) y vuelve a enviarla: se manda solo lo que cambies.`}
        chips={<Badge variant={info.variant}>{info.label}</Badge>}
      />
      {s.detalle && (
        <div className="bg-muted max-w-3xl rounded-card border p-5">
          <p className="text-small font-semibold">Qué pasó en el intento anterior</p>
          <p className="text-muted-foreground mt-1 text-small">{s.detalle}</p>
        </div>
      )}
      {corregible ? (
        <PdpForm opciones={opciones.data} solicitud={s} />
      ) : (
        <div className="flex max-w-3xl flex-col items-start gap-3 rounded-card border p-5">
          <p className="text-small">
            Esta solicitud está en “{info.label}”: solo se corrigen las que no encontraron datos o terminaron con error.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/pdps">Volver a la lista</Link>
          </Button>
        </div>
      )}
    </>
  );
}
