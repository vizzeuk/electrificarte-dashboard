import { modelosTendencia, funnelConversion, comparacionesFrecuentes, deviceBreakdown } from "./analytics-extra";

export interface SalesTip {
  title: string;
  detail: string;
}

export interface SalesTipsContext {
  /** Marcas que el vendedor efectivamente ofrece (`leads_vendors.marcas`). Vacío o
   *  ausente = no personalizar (p. ej. cuando no hay contexto de vendedor). */
  marcas?: string[];
}

/** Normaliza una marca a comparación laxa (sin espacios de sobra, minúsculas). */
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

/** Genera sugerencias de venta accionables a partir de la analítica del sitio, pero
 *  filtradas por lo que el vendedor realmente puede ofertar: un tip sobre un modelo
 *  de una marca que no vende es ruido. Si `ctx.marcas` viene vacío, no se filtra
 *  (comportamiento genérico). Reglas deterministas por ahora (mock); el mismo patrón
 *  sirve el día que esto se conecte a datos reales o se genere con un modelo. */
export function generateSalesTips(ctx: SalesTipsContext = {}): SalesTip[] {
  const marcas = (ctx.marcas ?? []).map(norm).filter(Boolean);
  const personaliza = marcas.length > 0;
  // ¿El vendedor vende esta marca? Sin contexto de marcas, todo aplica.
  const vendeMarca = (m: string) => !personaliza || marcas.includes(norm(m));
  // ¿El nombre de modelo ("BYD Dolphin") arranca con una marca que vende?
  const vendeModelo = (nombre: string) =>
    !personaliza || marcas.some((m) => norm(nombre).includes(m));

  const tendencia = [...modelosTendencia].sort((a, b) => b.variacionPct - a.variacionPct);
  const tips: SalesTip[] = [];

  // 1) Tendencia por modelo — SOLO de las marcas que el vendedor ofrece.
  const suyos = tendencia.filter((m) => vendeMarca(m.marca));
  const enAlza = suyos.find((m) => m.variacionPct > 0);
  const enBaja = [...suyos].reverse().find((m) => m.variacionPct < 0);

  if (personaliza && suyos.length === 0) {
    // Ningún modelo en tendencia pertenece a sus marcas: decirlo es más honesto y
    // más útil que empujarlo a ofertar algo que no tiene.
    tips.push({
      title: "Esta semana la tendencia no toca tus marcas",
      detail: `El interés se movió en ${tendencia[0].marca} y otras marcas que no ofreces. Cuando el modelo que sube no es tuyo, la palanca es el precio, el plazo de entrega o los beneficios de un equivalente que sí tengas.`,
    });
  } else {
    if (enAlza) {
      tips.push({
        title: `Prioriza ${enAlza.nombre}`,
        detail: `Su demanda subió ${enAlza.variacionPct}% esta semana${personaliza ? " y es de las marcas que vendes" : ""} — buen momento para destacarlo en tus ofertas antes de que la competencia también lo note.`,
      });
    }
    if (enBaja) {
      tips.push({
        title: `Refuerza ${enBaja.nombre} con precio o beneficios`,
        detail: `Bajó ${Math.abs(enBaja.variacionPct)}% de interés esta semana — un descuento puntual o destacar equipamiento puede recuperar al comprador que va quedando.`,
      });
    }
  }

  // 2) Fuga en el embudo — le sirve a cualquier vendedor, no depende de la marca.
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

  // 3) Comparación más frecuente — prioriza una donde el vendedor tenga uno de los dos.
  const comp =
    comparacionesFrecuentes.find((c) => vendeModelo(c.autoA) || vendeModelo(c.autoB)) ??
    comparacionesFrecuentes[0];
  if (comp) {
    // Si vende uno de los dos, ponlo primero: es el argumento que le toca defender.
    const mio = personaliza && vendeModelo(comp.autoB) && !vendeModelo(comp.autoA) ? comp.autoB : comp.autoA;
    const otro = mio === comp.autoA ? comp.autoB : comp.autoA;
    tips.push({
      title: `Prepárate para competir: ${mio} vs. ${otro}`,
      detail: `Es de las comparaciones más frecuentes en el comparador${personaliza && vendeModelo(mio) ? ` y ${mio} es tuyo` : ""} — ten a mano los argumentos de venta de ${mio} frente a ${otro} para cuando un cliente dude entre los dos.`,
    });
  }

  // 4) Dispositivo — genérico, pero real: cambia el "cómo" del contacto.
  const movil = deviceBreakdown.find((d) => d.dispositivo === "Móvil");
  if (movil && movil.porcentaje >= 50) {
    tips.push({
      title: "La mayoría te encuentra desde el celular",
      detail: `${movil.porcentaje}% del tráfico es móvil — responder rápido por WhatsApp pesa más que tener una respuesta perfecta pero tardía.`,
    });
  }

  return tips;
}
