"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUp, ChevronRight, GripVertical, LayoutGrid, RotateCcw, SlidersHorizontal } from "lucide-react";
import { CategoriasChart } from "@/components/categorias-chart";
import { CifraKpi, DeltaBadge, textoAnterior } from "@/components/cifra-kpi";
import { EmptyState } from "@/components/empty-state";
import { GraficoCard } from "@/components/grafico-card";
import { PageHeader } from "@/components/page-header";
import { PeriodoSelector } from "@/components/periodo-selector";
import { SerieChart } from "@/components/serie-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Actividad, ResumenData } from "@/lib/data/resumen-data";
import { AGRUPACIONES, conPeriodo } from "@/lib/periodo";
import { formatCifra, variacion } from "@/lib/series";
import { cn, formatFechaHora, formatNumero, hace } from "@/lib/utils";

// ─── Registro de widgets ─────────────────────────────────────────────────────
// Para agregar uno: sumarlo acá con un id NUEVO (los guardados se reconcilian solos: los ids
// desconocidos se descartan y los nuevos entran con su visibilidad por defecto al final).

type Tamano = "cifra" | "mitad" | "completo";

interface Ctx {
  d: ResumenData;
  /** "por día", "por semana", "por mes". */
  por: string;
  href: (url: string) => string;
}

interface WidgetDef {
  id: string;
  titulo: string;
  tipo: "Cifra" | "Gráfico" | "Tabla" | "Lista" | "Destacado";
  tamano: Tamano;
  visible: boolean;
  render: (c: Ctx) => React.ReactNode;
}

const TAMANO: Record<Tamano, string> = {
  cifra: "col-span-1",
  mitad: "col-span-2",
  completo: "col-span-2 lg:col-span-4",
};

const C1 = "var(--chart-1)";
const C3 = "var(--chart-3)";

const WIDGETS: WidgetDef[] = [
  {
    id: "destacado-waitlist",
    titulo: "Personas en la waitlist (destacado)",
    tipo: "Destacado",
    tamano: "completo",
    visible: true,
    render: ({ d, href }) => <Destacado d={d} href={href} />,
  },
  {
    id: "kpi-waitlist",
    titulo: "Personas nuevas en la waitlist",
    tipo: "Cifra",
    tamano: "cifra",
    visible: true,
    render: ({ d }) => <CifraKpi label="Personas nuevas en la waitlist" cifra={d.cifras.waitlistPersonas} comparacion={d.periodo.comparacion} />,
  },
  {
    id: "kpi-asesorias-pagadas",
    titulo: "Asesorías pagadas",
    tipo: "Cifra",
    tamano: "cifra",
    visible: true,
    render: ({ d }) => (
      <CifraKpi label="Asesorías pagadas" cifra={d.cifras.asesoriasPagadas} comparacion={d.periodo.comparacion} hint={`${formatNumero(d.hoy.asesoriasActivas)} activas hoy`} />
    ),
  },
  {
    id: "kpi-conversion",
    titulo: "Conversión de asesorías",
    tipo: "Cifra",
    tamano: "cifra",
    visible: true,
    render: ({ d }) => (
      <CifraKpi label="Conversión de asesorías" cifra={d.cifras.asesoriasConversion} comparacion={d.periodo.comparacion} vacio="Sin formularios" hint="Pagadas sobre formularios" />
    ),
  },
  {
    id: "kpi-resenas",
    titulo: "Reseñas recibidas",
    tipo: "Cifra",
    tamano: "cifra",
    visible: true,
    render: ({ d }) => (
      <CifraKpi
        label="Reseñas recibidas"
        cifra={d.cifras.resenasRecibidas}
        comparacion={d.periodo.comparacion}
        hint={d.hoy.resenasPorModerar ? `${formatNumero(d.hoy.resenasPorModerar)} por moderar hoy` : undefined}
      />
    ),
  },
  {
    id: "kpi-asesorias-formularios",
    titulo: "Formularios de asesoría",
    tipo: "Cifra",
    tamano: "cifra",
    visible: true,
    render: ({ d }) => <CifraKpi label="Formularios de asesoría" cifra={d.cifras.asesoriasFormularios} comparacion={d.periodo.comparacion} />,
  },
  {
    id: "kpi-newsletter",
    titulo: "Suscripciones al newsletter",
    tipo: "Cifra",
    tamano: "cifra",
    visible: true,
    render: ({ d }) => <CifraKpi label="Suscripciones al newsletter" cifra={d.cifras.newsletter} comparacion={d.periodo.comparacion} />,
  },
  {
    id: "kpi-vendedores",
    titulo: "Vendedores registrados",
    tipo: "Cifra",
    tamano: "cifra",
    visible: true,
    render: ({ d }) => (
      <CifraKpi label="Vendedores registrados" cifra={d.cifras.vendedores} comparacion={d.periodo.comparacion} hint={`${formatNumero(d.hoy.vendedoresActivos)} activos hoy`} />
    ),
  },
  {
    id: "kpi-waitlist-vendedores",
    titulo: "Waitlist de vendedores",
    tipo: "Cifra",
    tamano: "cifra",
    visible: true,
    render: ({ d }) =>
      d.hoy.waitlistVendedoresDisponible ? (
        <CifraKpi label="Waitlist de vendedores" cifra={d.cifras.waitlistVendedores} comparacion={d.periodo.comparacion} hint={`${formatNumero(d.hoy.waitlistVendedores)} en la lista hoy`} />
      ) : (
        <div className="flex min-w-0 flex-col border-t pt-4">
          <p className="text-small font-medium">Waitlist de vendedores</p>
          <p className="text-muted-foreground mt-2 text-small">Falta crear la tabla en Supabase.</p>
        </div>
      ),
  },
  {
    id: "chart-waitlist",
    titulo: "Gráfico: personas nuevas en la waitlist",
    tipo: "Gráfico",
    tamano: "mitad",
    visible: true,
    render: ({ d, por }) => (
      <GraficoCard title="Personas nuevas en la waitlist" description={`Primera inscripción de cada persona, ${por}`}>
        <SerieChart tramos={d.tramos} series={[{ key: "personas", label: "Personas nuevas", data: d.series.waitlistPersonas, color: C1 }]} />
      </GraficoCard>
    ),
  },
  {
    id: "chart-waitlist-acumulada",
    titulo: "Gráfico: crecimiento de la waitlist",
    tipo: "Gráfico",
    tamano: "mitad",
    visible: true,
    render: ({ d, por }) => (
      <GraficoCard title="Crecimiento de la waitlist" description={`Personas en la lista al cierre de cada tramo, ${por}`}>
        <SerieChart tramos={d.tramos} tipo="area" series={[{ key: "acumulada", label: "Personas en la lista", data: d.series.waitlistAcumulada, color: C1 }]} />
      </GraficoCard>
    ),
  },
  {
    id: "chart-asesorias",
    titulo: "Gráfico: asesorías, formularios y pagadas",
    tipo: "Gráfico",
    tamano: "mitad",
    visible: true,
    render: ({ d, por }) => (
      <GraficoCard title="Asesorías" description={`Formularios recibidos y asesorías pagadas, ${por}`}>
        <SerieChart
          tramos={d.tramos}
          series={[
            { key: "formularios", label: "Formularios", data: d.series.asesoriasFormularios, color: C3 },
            { key: "pagadas", label: "Pagadas", data: d.series.asesoriasPagadas, color: C1 },
          ]}
        />
      </GraficoCard>
    ),
  },
  {
    id: "chart-resenas",
    titulo: "Gráfico: reseñas recibidas y publicadas",
    tipo: "Gráfico",
    tamano: "mitad",
    visible: true,
    render: ({ d, por }) => (
      <GraficoCard title="Reseñas" description={`Recibidas y publicadas, ${por}`}>
        <SerieChart
          tramos={d.tramos}
          series={[
            { key: "recibidas", label: "Recibidas", data: d.series.resenasRecibidas, color: C3 },
            { key: "publicadas", label: "Publicadas", data: d.series.resenasPublicadas, color: C1 },
          ]}
        />
      </GraficoCard>
    ),
  },
  {
    id: "tabla-secciones",
    titulo: "Tabla: por sección",
    tipo: "Tabla",
    tamano: "mitad",
    visible: true,
    render: ({ d, href }) => <PorSeccion d={d} href={href} />,
  },
  {
    id: "actividad",
    titulo: "Actividad reciente",
    tipo: "Lista",
    tamano: "mitad",
    visible: true,
    render: ({ d, href }) => <ActividadLista d={d} href={href} />,
  },
  // ── Ocultos por defecto ──
  {
    id: "kpi-nota-resenas",
    titulo: "Nota promedio de las reseñas",
    tipo: "Cifra",
    tamano: "cifra",
    visible: false,
    render: ({ d }) => <CifraKpi label="Nota promedio de las reseñas" cifra={d.cifras.resenasNota} comparacion={d.periodo.comparacion} vacio="Sin notas" hint="De 1 a 5" />,
  },
  {
    id: "kpi-resenas-publicadas",
    titulo: "Reseñas publicadas",
    tipo: "Cifra",
    tamano: "cifra",
    visible: false,
    render: ({ d }) => <CifraKpi label="Reseñas publicadas" cifra={d.cifras.resenasPublicadas} comparacion={d.periodo.comparacion} />,
  },
  {
    id: "kpi-feedback",
    titulo: "Nota del sitio (feedback)",
    tipo: "Cifra",
    tamano: "cifra",
    visible: false,
    render: ({ d }) => (
      <CifraKpi
        label="Nota del sitio"
        cifra={d.cifras.feedbackNota}
        comparacion={d.periodo.comparacion}
        vacio="Sin notas"
        hint={`${formatNumero(d.cifras.feedbackCalificaciones.actual)} calificaciones en el período`}
      />
    ),
  },
  {
    id: "kpi-inscripciones",
    titulo: "Inscripciones a la waitlist (con repetidas)",
    tipo: "Cifra",
    tamano: "cifra",
    visible: false,
    render: ({ d }) => <CifraKpi label="Inscripciones a la waitlist" cifra={d.cifras.waitlistInscripciones} comparacion={d.periodo.comparacion} hint="Cuenta también las repetidas" />,
  },
  {
    id: "chart-resenas-nota",
    titulo: "Gráfico: nota promedio de las reseñas",
    tipo: "Gráfico",
    tamano: "mitad",
    visible: false,
    render: ({ d, por }) => (
      <GraficoCard title="Nota promedio de las reseñas" description={`De 1 a 5, reseñas no rechazadas, ${por}`}>
        <SerieChart tramos={d.tramos} tipo="linea" formato="nota" series={[{ key: "nota", label: "Nota promedio", data: d.series.resenasNota, color: C1 }]} vacio="Sin reseñas en este período." />
      </GraficoCard>
    ),
  },
  {
    id: "chart-resenas-categorias",
    titulo: "Gráfico: nota de las reseñas por categoría",
    tipo: "Gráfico",
    tamano: "completo",
    visible: false,
    render: ({ d, por }) => (
      <GraficoCard title="Nota por categoría" description={`Promedio de Autonomía, Confort, Agilidad y Calidad, ${por}`}>
        <CategoriasChart categorias={d.categorias} tramos={d.tramos} hayCategorias={d.hayCategorias} />
      </GraficoCard>
    ),
  },
  {
    id: "chart-newsletter",
    titulo: "Gráfico: suscripciones al newsletter",
    tipo: "Gráfico",
    tamano: "mitad",
    visible: false,
    render: ({ d, por }) => (
      <GraficoCard title="Newsletter" description={`Suscripciones nuevas, ${por}`}>
        <SerieChart tramos={d.tramos} series={[{ key: "newsletter", label: "Suscripciones", data: d.series.newsletter, color: C1 }]} />
      </GraficoCard>
    ),
  },
  {
    id: "chart-feedback",
    titulo: "Gráfico: nota del sitio (feedback)",
    tipo: "Gráfico",
    tamano: "mitad",
    visible: false,
    render: ({ d, por }) => (
      <GraficoCard title="Nota del sitio" description={`Promedio del botón “Tu opinión”, de 1 a 5, ${por}`}>
        <SerieChart tramos={d.tramos} tipo="linea" formato="nota" series={[{ key: "feedback", label: "Nota promedio", data: d.series.feedbackNota, color: C1 }]} vacio="Sin calificaciones en este período." />
      </GraficoCard>
    ),
  },
  {
    id: "chart-vendedores",
    titulo: "Gráfico: vendedores y waitlist de vendedores",
    tipo: "Gráfico",
    tamano: "mitad",
    visible: false,
    render: ({ d, por }) => (
      <GraficoCard title="Vendedores" description={`Registros en la plataforma y en la waitlist de vendedores, ${por}`}>
        <SerieChart
          tramos={d.tramos}
          series={[
            { key: "registrados", label: "Registrados", data: d.series.vendedores, color: C1 },
            { key: "waitlist", label: "Waitlist de vendedores", data: d.series.waitlistVendedores, color: C3 },
          ]}
        />
      </GraficoCard>
    ),
  },
];

const POR_ID = new Map(WIDGETS.map((w) => [w.id, w]));

// ─── Configuración guardada (localStorage, por usuario) ─────────────────────

interface Config {
  orden: string[];
  ocultos: string[];
}

const DEFAULT: Config = {
  orden: WIDGETS.map((w) => w.id),
  ocultos: WIDGETS.filter((w) => !w.visible).map((w) => w.id),
};

const EVENTO = "ec-panel-widgets";

/** Reconcilia lo guardado con el registro actual (ids viejos fuera, nuevos al final). */
function leerConfig(raw: string | null): Config {
  if (!raw) return DEFAULT;
  try {
    const c = JSON.parse(raw) as Partial<Config>;
    const orden = (c.orden ?? []).filter((id) => POR_ID.has(id));
    const conocidos = new Set(orden);
    const nuevos = WIDGETS.filter((w) => !conocidos.has(w.id));
    return {
      orden: [...orden, ...nuevos.map((w) => w.id)],
      ocultos: [...(c.ocultos ?? []).filter((id) => POR_ID.has(id)), ...nuevos.filter((w) => !w.visible).map((w) => w.id)],
    };
  } catch {
    return DEFAULT;
  }
}

function useConfig(storageKey: string) {
  const subscribe = useCallback((cb: () => void) => {
    const onStorage = (e: StorageEvent) => e.key === storageKey && cb();
    window.addEventListener("storage", onStorage);
    window.addEventListener(EVENTO, cb);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(EVENTO, cb);
    };
  }, [storageKey]);
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(storageKey);
      } catch {
        return null;
      }
    },
    () => null,
  );
  const config = useMemo(() => leerConfig(raw), [raw]);
  const guardar = useCallback(
    (c: Config | null) => {
      try {
        if (c) localStorage.setItem(storageKey, JSON.stringify(c));
        else localStorage.removeItem(storageKey);
      } catch {
        /* modo privado o cuota llena: la vista sigue, solo no se recuerda */
      }
      window.dispatchEvent(new Event(EVENTO));
    },
    [storageKey],
  );
  return { config, guardar, personalizado: raw != null };
}

// ─── Vista ───────────────────────────────────────────────────────────────────

export function ResumenVista({ d, usuario }: { d: ResumenData; usuario: string }) {
  const sp = useSearchParams();
  const { config, guardar, personalizado } = useConfig(`ec-panel:resumen:v1:${usuario.toLowerCase()}`);
  const [abierto, setAbierto] = useState(false);

  const ctx: Ctx = {
    d,
    por: AGRUPACIONES.find((a) => a.key === d.periodo.agrupar)!.porLabel,
    href: (url) => conPeriodo(url, sp),
  };
  const ocultos = new Set(config.ocultos);
  const visibles = config.orden.filter((id) => !ocultos.has(id)).map((id) => POR_ID.get(id)!);

  return (
    <>
      <PageHeader
        title="Resumen"
        subtitle={
          <>
            {d.periodo.etiqueta}
            {d.periodo.comparacion ? `, comparado ${d.periodo.comparacion.replace(/^vs\. /, "con ")}` : ""}. Actualizado el{" "}
            {formatFechaHora(new Date(d.generadoEn).toISOString())} (hora de Chile).
          </>
        }
        actions={
          <div className="flex flex-wrap items-start gap-2">
            <PeriodoSelector key={JSON.stringify(d.periodo)} periodo={d.periodo} />
            <Button variant="outline" size="sm" onClick={() => setAbierto(true)} className="cursor-pointer">
              <SlidersHorizontal strokeWidth={1.5} /> Personalizar
            </Button>
          </div>
        }
        className="sm:items-start"
      />

      {visibles.length === 0 ? (
        <div className="rounded-card border">
          <EmptyState
            icon={LayoutGrid}
            title="El resumen está vacío"
            description="Ocultaste todos los bloques. Elige cuáles mostrar o vuelve a la vista por defecto."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setAbierto(true)} className="cursor-pointer">
                  <SlidersHorizontal strokeWidth={1.5} /> Personalizar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => guardar(null)} className="cursor-pointer">
                  <RotateCcw strokeWidth={1.5} /> Vista por defecto
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {visibles.map((w) => (
            <section key={w.id} className={cn("min-w-0", TAMANO[w.tamano])} aria-label={w.titulo}>
              {w.render(ctx)}
            </section>
          ))}
        </div>
      )}

      <Personalizar
        abierto={abierto}
        onAbierto={setAbierto}
        config={config}
        guardar={guardar}
        personalizado={personalizado}
      />
    </>
  );
}

// ─── Panel de personalización ───────────────────────────────────────────────

function Personalizar({
  abierto,
  onAbierto,
  config,
  guardar,
  personalizado,
}: {
  abierto: boolean;
  onAbierto: (v: boolean) => void;
  config: Config;
  guardar: (c: Config | null) => void;
  personalizado: boolean;
}) {
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const ocultos = new Set(config.ocultos);

  function mover(id: string, a: number) {
    const orden = config.orden.filter((x) => x !== id);
    orden.splice(Math.max(0, Math.min(a, orden.length)), 0, id);
    guardar({ ...config, orden });
  }

  function alternar(id: string, visible: boolean) {
    guardar({ ...config, ocultos: visible ? config.ocultos.filter((x) => x !== id) : [...config.ocultos, id] });
  }

  const nVisibles = config.orden.filter((id) => !ocultos.has(id)).length;

  return (
    <Sheet open={abierto} onOpenChange={onAbierto}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-md">
        <SheetHeader className="border-b p-5 pr-14">
          <SheetTitle className="font-display text-h3 font-bold">Personalizar el resumen</SheetTitle>
          <SheetDescription>
            Elige qué bloques ver y en qué orden (arrastra o usa las flechas). Se guarda en este navegador, para tu usuario.
          </SheetDescription>
        </SheetHeader>
        <p className="text-muted-foreground border-b px-5 py-3 text-small tabular-nums" aria-live="polite">
          {formatNumero(nVisibles)} de {formatNumero(config.orden.length)} bloques visibles
        </p>
        <ol className="flex-1 divide-y overflow-y-auto">
          {config.orden.map((id, i) => {
            const w = POR_ID.get(id)!;
            const visible = !ocultos.has(id);
            return (
              <li
                key={id}
                draggable
                onDragStart={(e) => {
                  setArrastrando(id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  if (arrastrando && arrastrando !== id) e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (arrastrando) mover(arrastrando, i);
                  setArrastrando(null);
                }}
                onDragEnd={() => setArrastrando(null)}
                className={cn("flex items-center gap-2 px-3 py-2 transition-colors", arrastrando === id && "bg-muted")}
              >
                <GripVertical className="text-muted-foreground size-4 shrink-0 cursor-grab" strokeWidth={1.5} aria-hidden />
                <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-1">
                  <Checkbox checked={visible} onCheckedChange={(v) => alternar(id, v === true)} />
                  <span className="min-w-0">
                    <span className={cn("block truncate text-small font-medium", !visible && "text-muted-foreground")}>{w.titulo}</span>
                    <span className="text-muted-foreground block text-micro">
                      {w.tipo}
                      {w.tamano === "completo" ? ", ancho completo" : w.tamano === "mitad" ? ", media fila" : ""}
                    </span>
                  </span>
                </label>
                <Button variant="ghost" size="icon-sm" onClick={() => mover(id, i - 1)} disabled={i === 0} aria-label={`Subir ${w.titulo}`} className="cursor-pointer">
                  <ArrowUp strokeWidth={1.5} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => mover(id, i + 1)}
                  disabled={i === config.orden.length - 1}
                  aria-label={`Bajar ${w.titulo}`}
                  className="cursor-pointer"
                >
                  <ArrowDown strokeWidth={1.5} />
                </Button>
              </li>
            );
          })}
        </ol>
        <SheetFooter className="border-t p-5">
          <Button variant="outline" onClick={() => guardar(null)} disabled={!personalizado} className="cursor-pointer">
            <RotateCcw strokeWidth={1.5} /> Volver a la vista por defecto
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Bloques ─────────────────────────────────────────────────────────────────

function Destacado({ d, href }: { d: ResumenData; href: (u: string) => string }) {
  const c = d.cifras.waitlistPersonas;
  const v = variacion(c);
  const ant = textoAnterior(c, d.periodo.comparacion);
  return (
    // El bloque destacado (Glaciar, uno por pantalla): la waitlist es la métrica del giro.
    <div className="bg-accent-soft text-on-accent-soft rounded-card p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-small font-semibold">Personas en la waitlist hoy</p>
          <p className="font-display mt-2 text-h1 font-extrabold tabular-nums">{formatNumero(d.hoy.waitlistPersonas)}</p>
          <p className="mt-3 max-w-xl text-base">
            {c.actual === 0 ? "Nadie nuevo en el período" : `${formatCifra(c)} ${c.actual === 1 ? "persona nueva" : "personas nuevas"} en el período`}
            {ant ? ` (${ant}${v && v.signo !== 0 && v.texto !== "Nuevo" ? `, ${v.signo > 0 ? "sube" : "baja"} ${v.texto}` : ""})` : ""}.{" "}
            Es la base de demanda que se le ofrecerá a la red de vendedores oficiales.
          </p>
        </div>
        {/* El bloque es Glaciar en ambos temas, así que el botón usa los primitivos (Laguna). */}
        <Link
          href={href("/admin/waitlist")}
          className="group bg-laguna text-papel hover:bg-laguna-hover inline-flex h-12 shrink-0 items-center gap-2 self-start rounded-control px-5 text-[15px] font-semibold transition-colors focus-visible:outline-tinta sm:self-auto"
        >
          Ver la waitlist
          <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-[3px]" strokeWidth={1.5} />
        </Link>
      </div>
    </div>
  );
}

function PorSeccion({ d, href }: { d: ResumenData; href: (u: string) => string }) {
  const compara = !!d.periodo.comparacion;
  return (
    <GraficoCard title="Por sección" description={compara ? `Registros nuevos en el período, ${d.periodo.comparacion}` : "Registros en todo el historial"} className="gap-3 pb-0">
      <div className="-mx-5 overflow-hidden border-t">
        <table className="w-full text-small">
          <thead className="bg-muted text-muted-foreground">
            <tr className="border-b text-left text-label">
              <th scope="col" className="px-5 py-2.5 font-semibold">Sección</th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold">Período</th>
              {compara && <th scope="col" className="hidden px-3 py-2.5 text-right font-semibold sm:table-cell">Anterior</th>}
              {compara && <th scope="col" className="px-3 py-2.5 text-right font-semibold">Variación</th>}
              <th scope="col" className="w-8 px-3 py-2.5"><span className="sr-only">Abrir</span></th>
            </tr>
          </thead>
          <tbody>
            {/* Cada celda lleva su propio link (bloque completo) para que toda la fila sea clickeable.
                NO usar un link con ::after absoluto: position:relative en <tr> no se respeta. */}
            {d.secciones.map((f) => {
              const url = href(f.href);
              return (
                <tr key={f.href} className="hover:bg-muted group border-b transition-colors last:border-0">
                  <th scope="row" className="p-0 text-left font-normal">
                    <Link href={url} className="block px-5 py-2.5 focus-visible:outline-offset-[-2px]">
                      <span className="font-semibold">{f.nombre}</span>
                      {f.nota && <Badge variant="secondary" className="ml-2 align-middle">{f.nota}</Badge>}
                      {f.pendiente && <span className="text-muted-foreground block text-micro">{f.pendiente}</span>}
                    </Link>
                  </th>
                  <td className="p-0 text-right font-semibold tabular-nums">
                    <Link href={url} tabIndex={-1} aria-hidden className="block px-3 py-2.5">{formatCifra(f.cifra)}</Link>
                  </td>
                  {compara && (
                    <td className="hidden p-0 text-right tabular-nums sm:table-cell">
                      <Link href={url} tabIndex={-1} aria-hidden className="text-muted-foreground block px-3 py-2.5">
                        {formatCifra({ actual: f.cifra.anterior, formato: f.cifra.formato })}
                      </Link>
                    </td>
                  )}
                  {compara && (
                    <td className="p-0 text-right">
                      <Link href={url} tabIndex={-1} className="block px-3 py-2.5">
                        <DeltaBadge cifra={f.cifra} />
                      </Link>
                    </td>
                  )}
                  <td className="text-muted-foreground p-0">
                    <Link href={url} tabIndex={-1} aria-hidden className="block px-3 py-2.5">
                      <ChevronRight className="size-4 transition-transform group-hover:translate-x-[3px]" strokeWidth={1.5} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GraficoCard>
  );
}

const TIPO: Record<Actividad["tipo"], string> = {
  waitlist: "Waitlist",
  asesoria: "Asesoría",
  vendedor: "Vendedor",
  waitlistVendedor: "Waitlist vendedores",
  oferta: "Oferta",
  resena: "Reseña",
  newsletter: "Newsletter",
  feedback: "Feedback",
};

function ActividadLista({ d, href }: { d: ResumenData; href: (u: string) => string }) {
  return (
    <GraficoCard title="Actividad reciente" description="Lo último que entró en el período, de cualquier sección." className="gap-3 pb-0">
      {d.actividad.length === 0 ? (
        <div className="-mx-5 border-t">
          <EmptyState title="Sin actividad en el período" description="Prueba con un período más largo." />
        </div>
      ) : (
        <ol className="-mx-5 divide-y border-t">
          {d.actividad.map((a, i) => (
            <li key={`${a.tipo}-${a.fecha}-${i}`}>
              <Link href={href(a.href)} className="hover:bg-muted grid gap-1.5 px-5 py-3 transition-colors focus-visible:outline-offset-[-2px]">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-small font-semibold">{a.titulo}</span>
                  <span className="text-muted-foreground shrink-0 text-micro tabular-nums">{hace(a.fecha, d.generadoEn)}</span>
                </span>
                <span className="flex items-start gap-2">
                  <Badge variant="outline" className="shrink-0">{TIPO[a.tipo]}</Badge>
                  {a.detalle && <span className="text-muted-foreground line-clamp-2 text-small">{a.detalle}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </GraficoCard>
  );
}
