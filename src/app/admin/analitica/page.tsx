import { SiteAnalytics } from "@/components/site-analytics";
import { getTopConcesionarios } from "@/lib/data/ranking-data";

export const dynamic = "force-dynamic";

export default async function AdminAnaliticaPage() {
  const topConcesionarios = await getTopConcesionarios();
  return <SiteAnalytics topConcesionarios={topConcesionarios} />;
}
