export type LeadEstadoOferta = "pendiente" | "pagado" | "contactado" | "cerrado";
export type LeadEstadoAsesoria = "pendiente" | "pagado" | "en_conversacion" | "cerrado";

export interface LeadOferta {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  auto: string;
  marca: string;
  region: string;
  comuna: string;
  estado: LeadEstadoOferta;
  fecha: string;
  vendedorId?: string;
}

export interface LeadAsesoria {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  estado: LeadEstadoAsesoria;
  fecha: string;
  interes?: string;
}

export interface Vendedor {
  id: string;
  nombre: string;
  contacto: string;
  region: string;
  leadsOfertados: number;
  leadsGanados: number;
  tasaRespuesta: number;
  ultimaActividad: string;
  activo: boolean;
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
