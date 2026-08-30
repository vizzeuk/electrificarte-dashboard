-- =============================================================================
-- 0004 (2026-09-02) — ofertas.regalias_descripcion
-- =============================================================================
-- La puja ahora puede incluir regalías/beneficios con una descripción libre.
-- El dashboard escribe valor_regalias (monto CLP) + regalias_descripcion (texto).
-- Aplicar en: Supabase → SQL Editor.
-- =============================================================================

alter table public.ofertas
  add column if not exists regalias_descripcion text;
