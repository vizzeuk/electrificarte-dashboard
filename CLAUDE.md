# electrificarte-dashboard

Panel interno de Electrificarte: vista **Admin** (Francisco) y vista **Vendedor**.

> **Contexto completo del proyecto:** Electrificarte son **tres proyectos separados** — la web
> principal (`~/proyects/electrificarteweb`), la página de vendedores
> (`vendedores.electrificarte.com`, **no está en esta máquina**) y este dashboard. El negocio, las reglas
> y el estado general están en `~/proyects/electrificarteweb/docs/HANDOFF-CONDUCTOR.md` y
> `~/proyects/electrificarteweb/CLAUDE.md`. Léelos antes de trabajar acá.

## Estado: 100% datos mock

**No hay backend.** Todo sale de `src/lib/mock/`. Nada se guarda ni se envía: `OfertarDialog`
muestra un toast y ya. Conectarlo a datos reales (Supabase) es parte de la fase siguiente —
ver §7 del handoff.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · Recharts · TypeScript.
Corre en el puerto **3001** (`npm run dev`) para no chocar con electrificarteweb (3000).

## Estructura

```
src/app/admin/      Resumen · Analítica · Leads Asesoría · Leads Oferta · Vendedores
src/app/vendedor/   Resumen · Analítica · Leads activos · Leads disponibles
src/components/     Componentes propios (kpi-card, top-list, site-analytics…)
src/components/ui/  shadcn — no editar a mano, se regeneran
src/lib/mock/       Todos los datos simulados + tipos
```

## Diseño

Alineado con electrificarteweb: cyan `#00E5E5` como primario, `--chart-1..5` para gráficos,
soporte claro/oscuro vía `next-themes`. **No cambiar colores ni tipografías** sin autorización;
sí se pueden agregar componentes dentro de esa línea.

Jerarquía visual establecida (2026-08-11): hero (`FeaturedInsightCard`) > KPIs con sparkline >
gráficos/ranking > listas. La fila #1 de cualquier ranking se destaca con fondo tintado.

## Decisiones que conviene conocer

- **La analítica del sitio es el producto que se le vende a los vendedores**, no una
  herramienta interna. Por eso `/admin/analitica` y `/vendedor/analitica` renderizan el mismo
  componente (`site-analytics.tsx`) — deben mostrar exactamente lo mismo.
- Los "tips de venta" (`lib/mock/sales-tips.ts`) se derivan por reglas de la propia analítica.
  Es la capa de "qué hacer con el dato", que es lo que justifica pagar por esto.
- `KpiCard` es Server Component a propósito. Recibe `icon` como referencia de componente (una
  función), que no cruza el límite RSC: si se marca `"use client"`, el build falla. El
  sparkline vive aparte en `sparkline.tsx`, que sí es cliente.

## Pool de leads — regla de negocio

Los leads disponibles (pagados, sin vendedor asignado) son **visibles para todos los vendedores
activos por igual**. No hay asignación 1:1. Cualquiera puede ofertar. Un dashboard que filtre
"mis leads asignados" contradice el modelo.

## Verificar

```bash
npx tsc --noEmit && npm run build
npm run dev    # puerto 3001
```
