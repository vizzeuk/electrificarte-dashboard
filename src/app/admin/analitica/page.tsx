import { SiteAnalytics } from "@/components/site-analytics";
import { getTopConcesionarios } from "@/lib/data/ranking-data";

export const dynamic = "force-dynamic";

export default async function AdminAnaliticaPage() {
  const topConcesionarios = await getTopConcesionarios();
  // Los números de tráfico salen de lib/mock: en el admin se rotula como datos de prueba.
  return <SiteAnalytics topConcesionarios={topConcesionarios} mostrarAvisoPrueba />;
}
