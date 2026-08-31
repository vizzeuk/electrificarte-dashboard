import { SiteAnalytics } from "@/components/site-analytics";
import { SalesTipsCard } from "@/components/sales-tips-card";
import { getCurrentVendor } from "@/lib/auth/vendor";
import { generateSalesTips, parseMarcas } from "@/lib/mock/sales-tips";

export const dynamic = "force-dynamic";

/** La analítica del sitio se muestra 1:1 con /admin/analitica (es el producto que se
 *  vende). Los "tips de venta" son la capa de acción y sí son específicos del vendedor:
 *  se filtran por las marcas que realmente ofrece, así que se inyectan como slot y no
 *  viven en el componente compartido (donde el admin los vería sin ofertar). */
export default async function VendedorAnaliticaPage() {
  const vendor = await getCurrentVendor();
  const tips = generateSalesTips({ marcas: parseMarcas(vendor?.marcas) });
  return <SiteAnalytics action={<SalesTipsCard tips={tips} />} />;
}
