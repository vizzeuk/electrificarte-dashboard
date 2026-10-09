import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PdpForm } from "@/components/admin/pdp-form";
import { ErrorOpciones } from "@/components/admin/pdp-error";
import { getAdminEmail } from "@/lib/auth/admin";
import { obtenerOpciones } from "@/lib/pdp-api";

export const dynamic = "force-dynamic";

export default async function NuevaPdpPage() {
  if (!(await getAdminEmail())) notFound();
  const opciones = await obtenerOpciones();

  return (
    <>
      <PageHeader
        title="Nueva PDP"
        subtitle="Un modelo es una PDP, con sus versiones adentro. La investigación tarda unos 3 min y el borrador queda oculto en Studio."
      />
      {opciones.ok ? <PdpForm opciones={opciones.data} /> : <ErrorOpciones mensaje={opciones.errores[0]} />}
    </>
  );
}
