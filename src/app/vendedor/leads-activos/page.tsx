import { MisOfertasTable } from "@/components/mis-ofertas-table";
import { PageHeader } from "@/components/page-header";
import { getMisOfertas } from "@/lib/data/vendor-data";

export const dynamic = "force-dynamic";

export default async function MisOfertasPage() {
  const ofertas = await getMisOfertas();

  return (
    <div className="flex flex-col gap-8 px-4 lg:px-6">
      <PageHeader
        title="Mis ofertas"
        subtitle={`Tus pujas y su estado — ${ofertas.length} en total. El puntaje y el resultado los define el sistema al evaluar.`}
      />
      <MisOfertasTable ofertas={ofertas} />
    </div>
  );
}
