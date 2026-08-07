import type {
  TrafficSource,
  DeviceBreakdown,
  GeoVisita,
  FunnelStep,
  ModeloTendencia,
  ComparacionPar,
  EngagementStats,
} from "./types";

/** Canales de adquisición (equivalente al reporte de adquisición de GA4). */
export const trafficSources: TrafficSource[] = [
  { canal: "Orgánico (Google)", visitas: 6200, porcentaje: 44 },
  { canal: "Directo", visitas: 3100, porcentaje: 22 },
  { canal: "Redes sociales", visitas: 2400, porcentaje: 17 },
  { canal: "Referidos", visitas: 1500, porcentaje: 11 },
  { canal: "Pago (Ads)", visitas: 860, porcentaje: 6 },
];

/** Split de dispositivo (reporte de tecnología de GA4). */
export const deviceBreakdown: DeviceBreakdown[] = [
  { dispositivo: "Móvil", porcentaje: 68 },
  { dispositivo: "Escritorio", porcentaje: 27 },
  { dispositivo: "Tablet", porcentaje: 5 },
];

/** Top regiones por visitas (reporte geográfico de GA4) — clave para que un vendedor regional
 * entienda dónde se concentra la demanda antes de invertir en stock. */
export const topRegiones: GeoVisita[] = [
  { region: "Región Metropolitana", visitas: 7400 },
  { region: "Valparaíso", visitas: 1850 },
  { region: "Biobío", visitas: 1120 },
  { region: "Maule", visitas: 640 },
  { region: "Los Lagos", visitas: 510 },
  { region: "Coquimbo", visitas: 430 },
];

/** Embudo de conversión del sitio: de visita a formulario completado. */
export const funnelConversion: FunnelStep[] = [
  { paso: "Visitó el sitio", usuarios: 14060 },
  { paso: "Vio un listado (PLP)", usuarios: 6820 },
  { paso: "Vio una ficha de auto (PDP)", usuarios: 3910 },
  { paso: "Usó comparador o calculadora", usuarios: 1740 },
  { paso: "Completó el formulario", usuarios: 612 },
];

/** Modelos con mayor variación de tráfico semana vs. semana anterior — la señal más "vendible":
 * le dice al vendedor qué está por ponerse en demanda antes que a nadie más. */
export const modelosTendencia: ModeloTendencia[] = [
  { nombre: "BYD Seal", marca: "BYD", visitas: 540, variacionPct: 38 },
  { nombre: "Tesla Model 3", marca: "Tesla", visitas: 610, variacionPct: 22 },
  { nombre: "Kia EV6", marca: "Kia", visitas: 410, variacionPct: 17 },
  { nombre: "MG4 Electric", marca: "MG", visitas: 480, variacionPct: 9 },
  { nombre: "BYD Yuan Plus", marca: "BYD", visitas: 320, variacionPct: -6 },
  { nombre: "Hyundai Kona Electric", marca: "Hyundai", visitas: 290, variacionPct: -14 },
];

/** Pares de autos más comparados entre sí en /comparador — indica con qué compite cada modelo en
 * la cabeza del comprador. */
export const comparacionesFrecuentes: ComparacionPar[] = [
  { autoA: "BYD Dolphin", autoB: "MG4 Electric", veces: 184 },
  { autoA: "Tesla Model 3", autoB: "BYD Seal", veces: 151 },
  { autoA: "Kia EV6", autoB: "Hyundai Kona Electric", veces: 112 },
  { autoA: "BYD Yuan Plus", autoB: "Chevrolet Bolt EUV", veces: 96 },
  { autoA: "MG4 Electric", autoB: "BYD Dolphin Mini", veces: 74 },
];

/** Calidad del tráfico — nuevos vs. recurrentes y profundidad de la visita. */
export const engagement: EngagementStats = {
  visitantesNuevosPct: 71,
  visitantesRecurrentesPct: 29,
  duracionPromedioSeg: 154,
  paginasPorSesion: 3.4,
};

/** El modelo con mayor variación (positiva o negativa) — usado como hero en la página de
 * analítica y como teaser en los Resumen de ambos roles. */
export function getTopTendencia(): ModeloTendencia {
  return [...modelosTendencia].sort((a, b) => b.variacionPct - a.variacionPct)[0];
}
