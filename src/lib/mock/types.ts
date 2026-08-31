export type LeadEstadoAsesoria = "pendiente" | "pagado" | "en_conversacion" | "cerrado";

export interface LeadAsesoria {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: LeadEstadoAsesoria;
  fecha: string;
  interes?: string;
}

export interface TrafficPoint {
  fecha: string;
  visitas: number;
}

export interface TopPagina {
  ruta: string;
  label: string;
  visitas: number;
}

export interface TopAuto {
  nombre: string;
  marca: string;
  visitas: number;
}

export interface TopMarca {
  marca: string;
  visitas: number;
}

export interface TrafficSource {
  canal: string;
  visitas: number;
  porcentaje: number;
}

export interface DeviceBreakdown {
  dispositivo: string;
  porcentaje: number;
}

export interface GeoVisita {
  region: string;
  visitas: number;
}

export interface FunnelStep {
  paso: string;
  usuarios: number;
}

export interface ModeloTendencia {
  nombre: string;
  marca: string;
  visitas: number;
  variacionPct: number;
}

export interface ComparacionPar {
  autoA: string;
  autoB: string;
  veces: number;
}

export interface EngagementStats {
  visitantesNuevosPct: number;
  visitantesRecurrentesPct: number;
  duracionPromedioSeg: number;
  paginasPorSesion: number;
}
