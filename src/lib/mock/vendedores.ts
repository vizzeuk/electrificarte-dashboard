import type { Vendedor } from "./types";

export const vendedores: Vendedor[] = [
  { id: "v1", nombre: "AutoMax Ñuñoa",       contacto: "contacto@automaxnunoa.cl",   region: "Metropolitana", leadsOfertados: 6,  leadsGanados: 2, tasaRespuesta: 92, ultimaActividad: "2026-07-13", activo: true },
  { id: "v2", nombre: "Electro Motors Chile", contacto: "ventas@electromotors.cl",    region: "Metropolitana", leadsOfertados: 11, leadsGanados: 5, tasaRespuesta: 88, ultimaActividad: "2026-07-13", activo: true },
  { id: "v3", nombre: "EV Concept Las Condes", contacto: "hola@evconcept.cl",         region: "Metropolitana", leadsOfertados: 9,  leadsGanados: 3, tasaRespuesta: 76, ultimaActividad: "2026-07-12", activo: true },
  { id: "v4", nombre: "Motorpark Viña",      contacto: "contacto@motorparkvina.cl",  region: "Valparaíso",     leadsOfertados: 7,  leadsGanados: 2, tasaRespuesta: 81, ultimaActividad: "2026-07-11", activo: true },
  { id: "v5", nombre: "Sur Eléctrico Concepción", contacto: "ventas@sureléctrico.cl", region: "Biobío",         leadsOfertados: 5,  leadsGanados: 1, tasaRespuesta: 64, ultimaActividad: "2026-07-10", activo: true },
  { id: "v6", nombre: "Green Drive Temuco",  contacto: "contacto@greendrive.cl",     region: "Araucanía",      leadsOfertados: 4,  leadsGanados: 1, tasaRespuesta: 70, ultimaActividad: "2026-07-09", activo: true },
  { id: "v7", nombre: "Norte EV Antofagasta", contacto: "ventas@norteev.cl",         region: "Antofagasta",    leadsOfertados: 3,  leadsGanados: 0, tasaRespuesta: 45, ultimaActividad: "2026-07-05", activo: true },
  { id: "v8", nombre: "Patagonia Motors",    contacto: "contacto@patagoniamotors.cl", region: "Los Lagos",     leadsOfertados: 2,  leadsGanados: 1, tasaRespuesta: 55, ultimaActividad: "2026-07-08", activo: true },
  { id: "v9", nombre: "Maipú Autos Eléctricos", contacto: "info@maipuautos.cl",      region: "Metropolitana", leadsOfertados: 8,  leadsGanados: 2, tasaRespuesta: 79, ultimaActividad: "2026-06-30", activo: false },
];
