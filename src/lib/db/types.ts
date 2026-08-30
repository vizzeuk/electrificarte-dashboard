// Tipos que reflejan el esquema REAL de Supabase (verificado en vivo).
// El pool NUNCA incluye PII del cliente (telefono/email/rut).

/** Fila de la vista public.leads_pool — lead disponible SIN PII. */
export interface PoolLead {
  id: number;
  created_at: string | null;
  target_model: string | null;
  region: string | null;
  comuna: string | null;
  financing: string | null;
  parte_pago_marca: string | null;
  parte_pago_modelo: string | null;
  parte_pago_ano: string | null;
  parte_pago_km: string | null;
  parte_pago_duenos: string | null;
  parte_pago_deuda: string | null;
  status: string | null;
  cierra_at: string | null;
  cerrada_at: string | null;
}

export type OfertaEstado =
  | "pendiente"
  | "evaluada"
  | "ganadora"
  | "perdida"
  | "aceptada"
  | "rechazada"
  | "expirada";

export type VersionMatch =
  | "exacta"
  | "variacion_menor"
  | "upgrade"
  | "inferior"
  | "no_coincidente";

/** Fila de public.ofertas — la puja del vendedor. */
export interface Oferta {
  id: string;
  created_at: string | null;
  lead_id: number;
  vendor_id: string;
  precio_oferta: number | null;
  horas_entrega: number | null;
  version_match: string | null;
  acepta_financiamiento: boolean | null;
  valor_regalias: number | null;
  precio_publicado: number | null;
  marca_ofertada: string | null;
  modelo_ofertado: string | null;
  anio_ofertado: number | null;
  color_ofertado: string | null;
  estado: string | null;
  score_total: number | null;
  descalificada: boolean | null;
  motivo_descalificacion: string | null;
}

/** Payload que el dashboard escribe al crear una puja (el resto lo llena el backend).
 * El financiamiento NO va acá: lo define el perfil del vendedor y lo matchea el backend. */
export interface NuevaOfertaInput {
  lead_id: number;
  precio_oferta: number;
  horas_entrega: number;
  version_match: VersionMatch;
  valor_regalias: number;
  regalias_descripcion: string | null;
  marca_ofertada: string;
  modelo_ofertado: string;
  anio_ofertado: number;
  color_ofertado: string | null;
}
