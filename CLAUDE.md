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
- **Errores:** la web deja toda falla en `error` con la razón en `detalle` (sesión caída, tope de
  gasto, paso de n8n que respondió 500, trabada >30 min, `listo` que nadie tomó = VPS de n8n
  caída: las barre el propio GET y avisa por WhatsApp desde la web). El panel la muestra en rojo,
  avisa con un toast cuando una pasa a `error` mientras se mira la lista, y resume las de las
  últimas 24 h arriba. Con una web sin barrido, una `listo` >30 min solo muestra un aviso.
  Mock: modelo con "error" / "tope" / "falla"; `MOCK_SIN_BARRIDO=1` imita la web vieja.
- **Versiones con otra carrocería/electrificación:** cada versión puede traer `tipo` y
  `electrificacion` propios (opcionales, mismos `valor` de `/opciones`). "Igual que el modelo" =
  la clave no se manda; se omite también si es igual al del modelo. El "desde" (`precioBase`) es la
  más barata **de la electrificación del modelo**, como en la web. Publicar el panel solo después
  de la web: una web vieja los descarta en silencio.
- **Ficha técnica (PDF, opcional):** campo en "Fuente oficial" de Nueva/Corregir. Se sube primero
  con la server action `subirFichaPdp` → `POST /api/admin/pdp/ficha` (PDF crudo, máx. 4 MB,
  `serverActions.bodySizeLimit` en `next.config.ts`) y la solicitud lleva solo `ficha_file_id`
  y `ficha_nombre` (en Corregir: sin la clave se conserva, `null` la quita). El agente la usa solo
  para specs técnicas que la web no trae; el precio, último recurso. Publicar después de la web.
- **Dos precios por versión (oct-2026):** "Precio de lista" (el más alto que publica la marca) y
  "Con bonos y/o financiamiento" (opcional, el más bajo; tiene que ser menor). Va como
  `versiones[i].precio_financiamiento`; vacío = la clave no va y la web usa el que lea el agente con
  su cita (queda un hallazgo para confirmar). El sitio muestra en grande el segundo. Publicar el
  panel después de la web (PR "precios con financiamiento").
- **Ficha por versión (PDF, opcional):** "+ Ficha técnica de esta versión" en cada fila de versión.
  Se sube igual (`subirFichaPdp`) y viaja **dentro** de la versión (`versiones[i].ficha_file_id` /
  `ficha_nombre`). En Corregir, `versiones` va entera: una versión que conserva su ficha vuelve a
  mandar su id; sin él, la web la borra. El PDF recién elegido vive en estado aparte (por id de
  fila) hasta enviar. El agente la usa solo para las specs de esa versión. Solo la monta el
  pdp-runner de la VPS; publicar después de la web (PR "ficha técnica por versión").
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
