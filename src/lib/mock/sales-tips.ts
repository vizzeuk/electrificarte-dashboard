import { modelosTendencia } from "./analytics-extra";

export interface SalesTip {
  title: string;
  detail: string;
}

export interface SalesTipsContext {
  /** Marcas que el vendedor ofrece (`leads_vendors.marcas`). */
  marcas?: string[];
  /** Leads disponibles en sus marcas sobre los que todavía no ofertó. */
  oportunidades?: number;
  /** De esas oportunidades, cuántas cierran en menos de 24 h. */
  oportunidadesUrgentes?: number;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Parsea el campo libre `marcas` ("BYD, MG, Tesla") a lista limpia. */
export function parseMarcas(marcas: string | null | undefined): string[] {
  if (!marcas) return [];
  return marcas
    .split(/[,;/]+/)
    .map((m) => m.trim())
    .filter(Boolean);
}

/**
 * Sugerencias de venta — POCAS y sobre lo que el vendedor SÍ puede accionar (a qué leads
 * ofertar, qué priorizar, cómo competir). A propósito no incluye métricas del sitio (embudo,
 * dispositivo) que el vendedor no controla: eso es contexto, no acción. Reglas deterministas
 * por ahora; el patrón sirve igual cuando la data sea real o se genere con un modelo.
 */
export function generateSalesTips(ctx: SalesTipsContext = {}): SalesTip[] {
  const marcas = (ctx.marcas ?? []).map(norm).filter(Boolean);
  const personaliza = marcas.length > 0;
  const vendeMarca = (m: string) => !personaliza || marcas.includes(norm(m));

  const tips: SalesTip[] = [];

  // 1) Oportunidades concretas sin ofertar — lo más accionable: ofertar depende 100% del vendedor.
  const opo = ctx.oportunidades ?? 0;
  const urg = ctx.oportunidadesUrgentes ?? 0;
  if (opo > 0) {
    const s = opo === 1 ? "" : "s";
    tips.push({
      title: `Tenés ${opo} lead${s} en tus marcas sin ofertar`,
      detail:
        urg > 0
          ? `${urg} cierra${urg === 1 ? "" : "n"} en menos de 24 h. Ofertá ahora: un lead sin oferta es una venta que se lleva otro vendedor.`
          : `Cada oferta que enviás es una chance de cierre. Un lead sin ofertar no rinde — mandá tu puja antes de que se cierre la ventana.`,
    });
  }

  // 2) Qué priorizar: el modelo de SUS marcas con más demanda esta semana (acciona el vendedor
  //    teniéndolo listo para ofertar rápido).
  const enAlzaSuyo = [...modelosTendencia]
    .filter((m) => vendeMarca(m.marca) && m.variacionPct > 0)
    .sort((a, b) => b.variacionPct - a.variacionPct)[0];
  if (enAlzaSuyo) {
    tips.push({
      title: `Priorizá ${enAlzaSuyo.nombre} en tus ofertas`,
      detail: `Es el modelo de tus marcas con más demanda esta semana (+${enAlzaSuyo.variacionPct}%). Tenelo a mano para ofertar rápido apenas entre un lead.`,
    });
  }

  // 3) Palanca de negocio siempre disponible: ofertar una alternativa cuando no tiene el exacto.
  tips.push({
    title: "¿No tenés el modelo exacto? Ofertá una alternativa",
    detail:
      "Cuando no tengas el auto que pide el cliente, una alternativa parecida con buen precio o entrega te mantiene compitiendo por ese lead en vez de perderlo.",
  });

  return tips;
}
