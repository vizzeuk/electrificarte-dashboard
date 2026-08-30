-- =============================================================================
-- 0003 — Webhook: nueva oferta (INSERT en ofertas) → n8n Flujo 1
-- =============================================================================
-- Cuando el dashboard inserta una puja (estado 'pendiente'), Postgres le pega al
-- webhook de n8n, que dispara el ruteo/evaluación. Esto es lo mismo que hace
-- "Database Webhooks" del panel de Supabase, pero versionado en el repo.
--
-- ANTES DE CORRER: reemplazar los dos placeholders de abajo:
--   1) N8N_WEBHOOK_URL  → la Production URL del Flujo 1 (ej: https://<host>/webhook/auction-puja)
--   2) WEBHOOK_SECRET   → un secreto compartido para que n8n valide el origen
--      (si el webhook de n8n no usa auth, borrá esa línea del header).
-- Aplicar en: Supabase → SQL Editor.
-- =============================================================================

-- pg_net: HTTP asíncrono desde Postgres (disponible en Supabase).
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_n8n_nueva_oferta()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'N8N_WEBHOOK_URL',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'WEBHOOK_SECRET'
    ),
    body := jsonb_build_object(
      'type', 'nueva_oferta',
      'oferta_id', NEW.id,
      'lead_id', NEW.lead_id,
      'vendor_id', NEW.vendor_id,
      'estado', NEW.estado,
      'created_at', NEW.created_at
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_ofertas_nueva on public.ofertas;
create trigger trg_ofertas_nueva
  after insert on public.ofertas
  for each row
  when (NEW.estado = 'pendiente')
  execute function public.notify_n8n_nueva_oferta();

-- =============================================================================
-- Prueba: insertá una oferta de prueba y mirá en n8n si llegó el webhook.
-- Para ver llamadas de pg_net:  select * from net._http_response order by created desc limit 5;
-- =============================================================================
