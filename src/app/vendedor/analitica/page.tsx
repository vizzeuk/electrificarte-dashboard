import { SiteAnalytics } from "@/components/site-analytics";
import { SalesTipsCard } from "@/components/sales-tips-card";
import { getCurrentVendor } from "@/lib/auth/vendor";
import { getPoolLeads, getMisOfertas } from "@/lib/data/vendor-data";
import { getTopConcesionarios } from "@/lib/data/ranking-data";
import { generateSalesTips, parseMarcas } from "@/lib/mock/sales-tips";
import { leadRemaining } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** La analítica del sitio se muestra 1:1 con /admin/analitica (mismos números). Los "tips de
 *  venta" son la capa de acción y sí son del vendedor: se calculan sobre su pool real (leads en
 *  sus marcas sin ofertar) y sus marcas, y se inyectan como slot. */
export default async function VendedorAnaliticaPage() {
  const [vendor, pool, ofertas, topConcesionarios] = await Promise.all([
    getCurrentVendor(),
    getPoolLeads(),
    getMisOfertas(),
    getTopConcesionarios(),
  ]);

  const marcas = parseMarcas(vendor?.marcas);
  const marcasNorm = marcas.map((m) => m.toLowerCase());
  const ofertados = new Set(ofertas.map((o) => o.lead_id));
  const enMisMarcas = (target: string | null) =>
    marcasNorm.length === 0 || marcasNorm.some((m) => (target ?? "").toLowerCase().includes(m));

  const oportunidadesLeads = pool.filter((l) => !ofertados.has(l.id) && enMisMarcas(l.target_model));
  const oportunidadesUrgentes = oportunidadesLeads.filter((l) => {
    const u = leadRemaining(l.cierra_at)?.urgency;
    return u === "critico" || u === "urgente";
  }).length;

  const tips = generateSalesTips({
    marcas,
    oportunidades: oportunidadesLeads.length,
    oportunidadesUrgentes,
  });

  return (
    <SiteAnalytics
      action={<SalesTipsCard tips={tips} />}
      topConcesionarios={topConcesionarios}
    />
  );
}
