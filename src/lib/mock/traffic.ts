import type { TrafficPoint, TopPagina, TopAuto, TopMarca } from "./types";

/** Serie de visitas de los últimos 14 días (simulada). */
export const trafficSeries: TrafficPoint[] = [
  { fecha: "2026-06-30", visitas: 1180 },
  { fecha: "2026-07-01", visitas: 1240 },
  { fecha: "2026-07-02", visitas: 1190 },
  { fecha: "2026-07-03", visitas: 1310 },
  { fecha: "2026-07-04", visitas: 1420 },
  { fecha: "2026-07-05", visitas: 1050 },
  { fecha: "2026-07-06", visitas: 980 },
  { fecha: "2026-07-07", visitas: 1360 },
  { fecha: "2026-07-08", visitas: 1510 },
  { fecha: "2026-07-09", visitas: 1470 },
  { fecha: "2026-07-10", visitas: 1600 },
  { fecha: "2026-07-11", visitas: 1580 },
  { fecha: "2026-07-12", visitas: 1230 },
  { fecha: "2026-07-13", visitas: 1090 },
];

/** Top secciones/páginas del sitio, incluye PLPs y páginas core. */
export const topPaginas: TopPagina[] = [
  { ruta: "/",             label: "Home",                    visitas: 5210 },
  { ruta: "/marcas",       label: "Listado de marcas",        visitas: 3480 },
  { ruta: "/comparador",   label: "Comparador de vehículos",  visitas: 2760 },
  { ruta: "/calculadora",  label: "Calculadora de ahorro",    visitas: 2190 },
  { ruta: "/tipo/suv",     label: "PLP — SUV eléctricos",     visitas: 1940 },
  { ruta: "/marcas/byd",   label: "PLP — BYD",                visitas: 1710 },
  { ruta: "/solicitar",    label: "Formulario Oferta",        visitas: 1120 },
  { ruta: "/asesoria",     label: "Asesoría IA",              visitas: 640 },
];

export const topAutos: TopAuto[] = [
  { nombre: "BYD Dolphin",          marca: "BYD",     visitas: 1420 },
  { nombre: "Tesla Model 3",        marca: "Tesla",   visitas: 1305 },
  { nombre: "MG4 Electric",         marca: "MG",      visitas: 1080 },
  { nombre: "Kia EV6",              marca: "Kia",     visitas: 940 },
  { nombre: "Hyundai Kona Electric", marca: "Hyundai", visitas: 875 },
  { nombre: "BYD Yuan Plus",        marca: "BYD",     visitas: 810 },
];

export const topMarcas: TopMarca[] = [
  { marca: "BYD",      visitas: 3640 },
  { marca: "Tesla",    visitas: 2810 },
  { marca: "MG",       visitas: 2190 },
  { marca: "Kia",      visitas: 1750 },
  { marca: "Hyundai",  visitas: 1520 },
  { marca: "Chevrolet", visitas: 980 },
];
