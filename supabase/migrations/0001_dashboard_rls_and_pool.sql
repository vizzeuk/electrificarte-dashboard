-- =============================================================================
-- Dashboard de vendedores — RLS + vista de pool sin PII + vínculo Auth↔vendedor
-- =============================================================================
-- Contexto: hoy la anon key (que viaja al browser) lee TODAS las filas de leads,
-- leads_vendors y stock_maestro (RLS OFF). Esta migración cierra ese agujero.
--
-- Aplicar en: Supabase → SQL Editor. Idempotente donde se puede.
-- Modelo de acceso del dashboard:
--   - Vendedor autenticado (rol `authenticated`): lee su propia fila de
--     leads_vendors, lee/inserta SUS ofertas, y lee el pool por la vista leads_pool.
--   - NO accede a la tabla leads directamente (PII). El pool va por la vista.
--   - service_role (server-side) bypassea RLS para escrituras con reglas de negocio.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Vínculo Auth ↔ vendedor
-- -----------------------------------------------------------------------------
-- Para v1 el match es por email verificado (auth.jwt() email == leads_vendors.email).
-- Agregamos user_id para el futuro: n8n (o el primer login) linkea la fila al usuario
-- de Supabase Auth. Las políticas aceptan ambos caminos.
alter table public.leads_vendors
  add column if not exists user_id uuid references auth.users(id);

create index if not exists leads_vendors_user_id_idx on public.leads_vendors(user_id);
create index if not exists leads_vendors_email_idx on public.leads_vendors(lower(email));

-- -----------------------------------------------------------------------------
-- 2) Vista del pool SIN PII (leads-disponibles)
-- -----------------------------------------------------------------------------
-- Expone SOLO lo necesario para ofertar. Nunca telefono/email/rut.
-- Un lead está "disponible" si está pagado y la subasta no se cerró.
-- security_invoker = false (default): la vista corre como su owner y por eso puede
-- leer leads aunque el vendedor no tenga acceso directo a la tabla. Se limita el
-- riesgo restringiendo las columnas y otorgando SELECT solo a `authenticated`.
create or replace view public.leads_pool as
select
  l.id,
  l.created_at,
  l.target_model,
  l.region,
  l.comuna,
  l.financing,
  l.parte_pago_marca,
  l.parte_pago_modelo,
  l.parte_pago_ano,
  l.parte_pago_km,
  l.parte_pago_duenos,
  l.parte_pago_deuda,
  l.status,
  l.cierra_at,
  l.cerrada_at
from public.leads l
where l.status = 'pagado'
  and l.cerrada_at is null;

-- La vista NO debe ser legible por anon. Solo vendedores logueados.
revoke all on public.leads_pool from anon;
grant select on public.leads_pool to authenticated;

-- -----------------------------------------------------------------------------
-- 3) RLS: leads (tabla base con PII) — bloqueada para clientes
-- -----------------------------------------------------------------------------
-- Los vendedores NO leen leads directamente; usan leads_pool. Con RLS ON y sin
-- política para anon/authenticated, la tabla queda cerrada salvo service_role.
alter table public.leads enable row level security;
-- (Sin políticas de SELECT para anon/authenticated a propósito.)

-- -----------------------------------------------------------------------------
-- 4) RLS: leads_vendors — cada vendedor ve/edita SOLO su fila
-- -----------------------------------------------------------------------------
alter table public.leads_vendors enable row level security;

drop policy if exists "vendor selecciona su fila" on public.leads_vendors;
create policy "vendor selecciona su fila"
  on public.leads_vendors for select to authenticated
  using (
    user_id = auth.uid()
    or (user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  );

drop policy if exists "vendor edita su fila" on public.leads_vendors;
create policy "vendor edita su fila"
  on public.leads_vendors for update to authenticated
  using (
    user_id = auth.uid()
    or (user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  )
  with check (
    user_id = auth.uid()
    or (user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  );

-- -----------------------------------------------------------------------------
-- 5) RLS: ofertas — cada vendedor inserta a su nombre y lee solo las suyas
-- -----------------------------------------------------------------------------
-- Helper: id del vendedor logueado (por user_id o por email verificado).
-- SECURITY DEFINER para que la resolución no dependa de la RLS de leads_vendors.
create or replace function public.current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.leads_vendors
  where user_id = auth.uid()
     or (user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  limit 1;
$$;

revoke all on function public.current_vendor_id() from public;
grant execute on function public.current_vendor_id() to authenticated;

alter table public.ofertas enable row level security;

drop policy if exists "vendor lee sus ofertas" on public.ofertas;
create policy "vendor lee sus ofertas"
  on public.ofertas for select to authenticated
  using (vendor_id = public.current_vendor_id());

-- Insert desde el cliente: solo a su nombre y estado inicial pendiente.
-- (El insert "oficial" pasa por server action con service_role; esta política
-- protege el caso de escritura directa con anon.)
-- OJO gating por estado: el dato real de leads_vendors.estado hoy es 'nuevo'
-- (NO 'activo'). Definir qué valores significan "suscripción activa" antes de
-- exigirlo acá — ver ACTIVE_VENDOR_ESTADOS abajo. Por ahora NO se exige estado
-- en el insert para no bloquear; el gating de vendedor activo se hace también en
-- el middleware del dashboard (configurable por env).
drop policy if exists "vendor inserta su oferta" on public.ofertas;
create policy "vendor inserta su oferta"
  on public.ofertas for insert to authenticated
  with check (
    vendor_id = public.current_vendor_id()
    and estado = 'pendiente'
    -- Descomentar y ajustar la lista cuando se confirmen los valores reales:
    -- and exists (
    --   select 1 from public.leads_vendors v
    --   where v.id = vendor_id and v.estado = any (array['activo','pago'])
    -- )
  );

-- =============================================================================
-- PENDIENTE DE CONFIRMAR (valores reales en vivo):
--   - leads.status: 'pagado' (confirmado).
--   - leads_vendors.estado: hoy = 'nuevo'. ¿Qué valor(es) = "suscripción activa"?
--     Ese set (ACTIVE_VENDOR_ESTADOS) gobierna quién puede loguearse y ofertar.
-- =============================================================================
