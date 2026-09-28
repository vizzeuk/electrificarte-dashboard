import { ResumenVista } from "@/components/admin/resumen-widgets";
import { getAdminEmail } from "@/lib/auth/admin";
import { getResumen } from "@/lib/data/resumen-data";

export const dynamic = "force-dynamic";

/**
 * Resumen tipo BI: período en la URL (?periodo=, ?desde=&hasta=, ?agrupar=), cifras con
 * variación contra el período anterior, series de tiempo y una grilla de bloques que cada
 * usuario puede mostrar/ocultar y reordenar (se guarda en su navegador).
 */
export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, email] = await Promise.all([searchParams, getAdminEmail()]);
  const d = await getResumen(sp);
  if (!d || !email) return null; // el layout ya gatea; sin sesión admin no hay datos
  return <ResumenVista d={d} usuario={email} />;
}
