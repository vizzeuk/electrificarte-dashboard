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
  Vendedores, Waitlist de vendedores, Leads Oferta (en pausa), Reseñas. **PDPs** no lee Supabase: habla con la web (ver abajo).
- **Período (vista BI):** vive en la URL (`?periodo=7d|30d|90d|12m|todo`, o `?desde=&hasta=`
  AAAA-MM-DD, más `?agrupar=dia|semana|mes`), en hora de Chile. `lib/periodo.ts` lo resuelve
  (y el período anterior de igual largo para las variaciones); `lib/series.ts` agrupa y compara.
  Las lecturas se acotan desde el inicio del período anterior. La barra lateral conserva el
  período al navegar y las tablas (`DataTable` con `periodo`) ya reciben filas filtradas.
- **Resumen configurable:** `components/admin/resumen-widgets.tsx` es el registro de bloques;
  la configuración (orden + ocultos) se guarda en localStorage por usuario
  (`ec-panel:resumen:v1:<email>`). Para agregar un bloque, sumarlo al registro con id nuevo.
- **Fail-soft con migraciones:** reseñas por categoría y `waitlist_vendedores` (migración del
  27-sep en la web) se leen con reintento sin columnas / aviso si la tabla no existe.
- **Analítica del sitio: mock** (`src/lib/mock/`). En el admin se rotula "Datos de prueba".
- Vista vendedor: pool, ofertas y cuenta desde Supabase (RLS); tips y analítica, mock.

## PDPs (crear fichas desde el panel)

`/admin/pdps` (lista "PDPs en creación") · `/admin/pdps/nueva` · `/admin/pdps/[id]/corregir`.
Contrato: "Crear PDPs desde el panel" de la web (la web es dueña de la validación, la cola y
la escritura en Sanity; el panel solo muestra formulario y lista).

- **Consume** `GET /api/admin/pdp/opciones` (cache en memoria 5 min), `GET|POST
  /api/admin/pdp/solicitudes`, `POST …/solicitudes/reintentar` (con `cambios` = solo lo que
  cambió) y `POST …/solicitudes/cancelar`.
- **Solo servidor:** `src/lib/pdp-api.ts` (`server-only`) es el único que lleva el header
  `x-admin-secret`; las server actions de `app/admin/pdps/actions.ts` validan `getAdminEmail()`
  antes de llamar. `creado_por` lo pone el servidor con el correo de la sesión.
  `redirect: "manual"`: un 3xx se informa como error de configuración (la base va con www).
- **Variables:** las mismas de reseñas, `ELECTRIFICARTE_API_BASE` (default
  `https://www.electrificarte.com`) y `ADMIN_API_SECRET` (el de Vercel). No hay variables nuevas.
- **Refresco:** cada 15 s solo mientras haya alguna en `listo`/`en cola`/`procesando` y la
  pestaña esté visible; al volver a la pestaña consulta una vez. Tipos y reglas por estado
  (etiquetas, qué acción va en cada uno, la regla de los 30 min) en `src/lib/pdp.ts`.
- **Mock local** (los endpoints de la web aún no están desplegados):
  `node scripts/mock-pdp-api.mjs` (puerto 3401, secreto `mock-secreto-pdp`; el encabezado
  explica los gatillos para forzar 422/409/avisos) y en otra terminal
  `ELECTRIFICARTE_API_BASE=http://localhost:3401 ADMIN_API_SECRET=mock-secreto-pdp npx next dev --webpack -p 3001`.

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
