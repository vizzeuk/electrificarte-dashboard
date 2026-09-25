# electrificarte-dashboard

Panel interno de Electrificarte: vista **Admin** (Francisco) y vista **Vendedor**.

> **Contexto completo del proyecto:** Electrificarte son **tres proyectos separados** — la web
> principal (`~/proyects/electrificarteweb`), la página de vendedores
> (`vendedores.electrificarte.com`, **no está en esta máquina**) y este dashboard. El negocio, las reglas
> y el estado general están en `~/proyects/electrificarteweb/docs/HANDOFF-CONDUCTOR.md` y
> `~/proyects/electrificarteweb/CLAUDE.md`. Léelos antes de trabajar acá.

## Estado de los datos

- **Admin: datos reales de Supabase, solo lectura** (salvo moderar reseñas). Todo se lee con
  service role en el servidor (`src/lib/data/admin-data.ts`, `reviews-data.ts`), detrás de
  `getAdminEmail()`. Secciones: Resumen, Waitlist, Asesorías, Newsletter, Feedback del sitio,
  Vendedores, Leads Oferta (en pausa), Reseñas.
- **Analítica del sitio: mock** (`src/lib/mock/`). En el admin se rotula "Datos de prueba".
- Vista vendedor: pool, ofertas y cuenta desde Supabase (RLS); tips y analítica, mock.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · Recharts · TypeScript.
Corre en el puerto **3001** (`npm run dev`) para no chocar con electrificarteweb (3000).

## Estructura

```
src/app/admin/        Resumen · Waitlist · Asesorías · Newsletter · Feedback · Vendedores · Leads Oferta · Reseñas · Analítica
src/app/vendedor/     Resumen · Leads disponibles · Mis ofertas · Analítica · Mi cuenta (Ley 21.719)
src/components/       Propios: data-table (búsqueda, filtros, orden, CSV, detalle), kpi, page-header…
src/components/admin/ Tablas de cada sección admin (columnas en cliente)
src/components/ui/    shadcn, ajustado al sistema v1 (sin sombras, radios 4/8/12, alturas 40/48/56)
src/lib/mock/         Datos simulados de la analítica
```

## Diseño

Rige el **sistema de diseño v1** de la web (fuente de verdad: `docs/design/portable/` en
electrificarteweb). `src/app/tokens.css` y `src/app/shadcn-theme.css` son **copias**: no se
editan acá, se vuelven a copiar si cambia un token. Laguna `#1d605b` = acción (`bg-primary`),
Glaciar `#caefea` = bloque destacado, uno por pantalla (`bg-accent-soft`); en shadcn `accent`
es el hover suave. Cabinet Grotesk (títulos) + Switzer (todo lo demás), bajadas por
`scripts/fetch-fonts.mjs` en predev/prebuild (no se versionan). Tema claro/oscuro con
next-themes (clase `.dark`, toggle en el header). **`npm run design:check`** falla si vuelve un
patrón del diseño anterior. Ojo: `cn()` usa un tailwind-merge extendido con la escala del
sistema (`text-micro`, `rounded-card`…); sin eso borra tamaños de letra.

## Decisiones que conviene conocer

- **La analítica del sitio es el producto que se le vende a los vendedores**, no una
  herramienta interna. Por eso `/admin/analitica` y `/vendedor/analitica` renderizan el mismo
  componente (`site-analytics.tsx`) — los **números** deben ser exactamente iguales.
- Los "tips de venta" (`lib/mock/sales-tips.ts`) son la capa de "qué hacer con el dato" y son
  **específicos del vendedor**: `generateSalesTips({ marcas })` filtra por las marcas que ese
  vendedor realmente ofrece (`leads_vendors.marcas`) — un tip sobre una marca que no vende es
  ruido. Por eso NO viven en `site-analytics.tsx` (el admin no oferta): se inyectan como slot
  `action` solo desde `/vendedor/analitica`. No devolverlos al componente compartido.
- `KpiCard` es Server Component a propósito. Recibe `icon` como referencia de componente (una
  función), que no cruza el límite RSC: si se marca `"use client"`, el build falla. El
  sparkline vive aparte en `sparkline.tsx`, que sí es cliente.

## Pool de leads — regla de negocio

Los leads disponibles (pagados, sin vendedor asignado) son **visibles para todos los vendedores
activos por igual**. No hay asignación 1:1. Cualquiera puede ofertar. Un dashboard que filtre
"mis leads asignados" contradice el modelo.

## Verificar

```bash
npx tsc --noEmit && npm run design:check && npm run build
npm run dev    # puerto 3001
```
