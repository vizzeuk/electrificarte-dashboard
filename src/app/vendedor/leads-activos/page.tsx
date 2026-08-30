import { MisOfertasTable } from "@/components/mis-ofertas-table";
import { getMisOfertas } from "@/lib/data/vendor-data";

export const dynamic = "force-dynamic";

export default async function MisOfertasPage() {
  const ofertas = await getMisOfertas();

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mis ofertas</h1>
        <p className="text-muted-foreground">
          Tus pujas y su estado — {ofertas.length} en total. El puntaje y el
          resultado los define el sistema al evaluar.
        </p>
      </div>
      <MisOfertasTable ofertas={ofertas} />
    </div>
  );
}
