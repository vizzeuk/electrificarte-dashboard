import { modelosTendencia, funnelConversion, comparacionesFrecuentes, deviceBreakdown } from "./analytics-extra";

export interface SalesTip {
  title: string;
  detail: string;
}

/** Genera sugerencias de venta accionables a partir de la misma data de analítica — el
 * diferencial frente a "solo mostrar números": le dice al vendedor qué hacer con cada dato.
 * Reglas simples y deterministas por ahora (mock); el mismo patrón sirve el día que esto se
 * conecte a datos reales o se generen con un modelo de lenguaje. */
export function generateSalesTips(): SalesTip[] {
  const tendencia = [...modelosTendencia].sort((a, b) => b.variacionPct - a.variacionPct);
  const top = tendencia[0];
  const bottom = tendencia[tendencia.length - 1];
  const tips: SalesTip[] = [];

  if (top.variacionPct > 0) {
    tips.push({
      title: `Prioriza ${top.nombre}`,
      detail: `Su demanda subió ${top.variacionPct}% esta semana — es buen momento para destacarlo en tus ofertas antes de que la competencia también lo note.`,
    });
  }

  if (bottom.variacionPct < 0) {
    tips.push({
      title: `Refuerza ${bottom.nombre} con precio o beneficios`,
      detail: `Bajó ${Math.abs(bottom.variacionPct)}% de interés esta semana — un descuento puntual o destacar equipamiento puede recuperar el interés que va quedando.`,
    });
  }

  let dropIdx = 1;
  let dropPct = 0;
  for (let i = 1; i < funnelConversion.length; i++) {
    const d = 1 - funnelConversion[i].usuarios / funnelConversion[i - 1].usuarios;
    if (d > dropPct) {
      dropPct = d;
      dropIdx = i;
    }
  }
  tips.push({
    title: "Ahí es donde se pierden más compradores",
    detail: `${Math.round(dropPct * 100)}% se pierde entre "${funnelConversion[dropIdx - 1].paso}" y "${funnelConversion[dropIdx].paso}" — un mensaje de seguimiento en ese momento puede recuperar ventas.`,
  });

  const topComp = comparacionesFrecuentes[0];
  tips.push({
    title: `Prepárate para competir: ${topComp.autoA} vs. ${topComp.autoB}`,
    detail: `Es la comparación más frecuente en el comparador — ten a mano los argumentos de venta de ${topComp.autoA} frente a ${topComp.autoB} para cuando un cliente dude entre los dos.`,
  });

  const movil = deviceBreakdown.find((d) => d.dispositivo === "Móvil");
  if (movil && movil.porcentaje >= 50) {
    tips.push({
      title: "La mayoría te encuentra desde el celular",
      detail: `${movil.porcentaje}% del tráfico es móvil — responder rápido por WhatsApp pesa más que tener una respuesta perfecta pero tardía.`,
    });
  }

  return tips;
}
