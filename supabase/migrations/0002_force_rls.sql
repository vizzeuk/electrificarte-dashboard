-- =============================================================================
-- 0002 — Forzar RLS en leads / leads_vendors / ofertas (fix de 0001)
-- =============================================================================
-- Diagnóstico: tras 0001 la anon key seguía leyendo PII de `leads` y
-- `leads_vendors`. Causa probable: una política permisiva vieja (using(true))
-- creada desde el UI de Supabase, o que el bloque RLS de 0001 no llegó a correr.
-- Este script es re-ejecutable: borra TODAS las políticas de esas 3 tablas y
-- recrea solo las que queremos. Al final imprime el estado real.
-- Aplicar en: Supabase → SQL Editor. Si tira error, copiá el mensaje.
-- =============================================================================

-- 1) Borrar cualquier política preexistente en las 3 tablas (limpia leftovers).
do $$
declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('leads','leads_vendors','ofertas')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- 2) Forzar RLS (y FORCE, para que ni el owner bypassee vía PostgREST).
alter table public.leads          enable row level security;
alter table public.leads          force  row level security;
alter table public.leads_vendors  enable row level security;
alter table public.leads_vendors  force  row level security;
alter table public.ofertas        enable row level security;
alter table public.ofertas        force  row level security;

-- 3) Helper: id del vendedor logueado (por user_id o email verificado).
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

-- 4) leads: NADIE (anon/authenticated) lee la tabla base con PII. Solo service_role
--    (bypassa RLS) y la vista leads_pool. => sin políticas de SELECT a propósito.

-- 5) leads_vendors: cada vendedor ve/edita SOLO su fila.
create policy "vendor selecciona su fila"
  on public.leads_vendors for select to authenticated
  using (
    user_id = auth.uid()
    or (user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  );

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

-- 6) ofertas: cada vendedor lee/inserta solo las suyas (estado inicial pendiente).
create policy "vendor lee sus ofertas"
  on public.ofertas for select to authenticated
  using (vendor_id = public.current_vendor_id());

create policy "vendor inserta su oferta"
  on public.ofertas for insert to authenticated
  with check (
    vendor_id = public.current_vendor_id()
    and estado = 'pendiente'
    -- gating por vendedor activo: descomentar cuando se confirmen los valores
    -- reales de leads_vendors.estado (hoy 'nuevo'):
    -- and exists (select 1 from public.leads_vendors v
    --             where v.id = vendor_id and v.estado = any (array['activo']))
  );

-- 7) Asegurar que la vista del pool sigue sin anon.
revoke all on public.leads_pool from anon;
grant select on public.leads_pool to authenticated;

-- =============================================================================
-- DIAGNÓSTICO (resultado del último SELECT = lo que muestra el SQL editor)
-- =============================================================================
select
  c.relname                              as tabla,
  c.relrowsecurity                       as rls_enabled,
  c.relforcerowsecurity                  as rls_forced,
  coalesce(
    (select string_agg(p.policyname || ' [' || p.cmd || ']', ', ')
     from pg_policies p
     where p.schemaname = 'public' and p.tablename = c.relname),
    '(sin políticas)'
  )                                      as politicas
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('leads','leads_vendors','ofertas')
order by c.relname;
