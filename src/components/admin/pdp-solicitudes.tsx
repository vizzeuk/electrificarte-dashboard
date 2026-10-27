"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CarFront, ChevronDown, CircleAlert, ExternalLink, LoaderCircle, Pencil, Plus, RefreshCw, RotateCcw, SearchX, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { cancelarPdp, listarPdps, reintentarPdp } from "@/app/admin/pdps/actions";
import { accionesDe, diferenciasVersion, esActiva, estadoInfo, formatUsd, nombrePdp, ORDEN_ESTADOS, precioBase, type PdpSolicitud } from "@/lib/pdp";
import { cn, formatCLP, formatFechaHora, formatNumero, hace } from "@/lib/utils";

const INTERVALO = 15_000;
const UN_DIA = 24 * 60 * 60_000;

function Versiones({ s }: { s: PdpSolicitud }) {
  const vs = s.versiones ?? [];
  if (vs.length === 0) {
    return <p className="text-muted-foreground text-small">Sin versiones declaradas: el precio se toma de la fuente oficial.</p>;
  }
  const desde = precioBase(vs, s.electrificacion);
  return (
    <p className="text-small">
      <span className="font-semibold">
        {vs.length} versi{vs.length === 1 ? "ón" : "ones"}
      </span>
      <span className="text-muted-foreground">
        : {vs.map((v) => (diferenciasVersion(v) ? `${v.nombre} — ${diferenciasVersion(v)}` : v.nombre)).join(", ")}
        {vs.some((v) => v.precio_financiamiento) && " · con precio con bonos y/o financiamiento declarado"}
      </span>
      {desde != null && (
        <span className="text-muted-foreground">
          . Desde <span className="text-foreground tabular-nums">{formatCLP(desde)}</span>
        </span>
      )}
    </p>
  );
}

function Fila({
  s,
  now,
  ocupada,
  onReintentar,
  onCancelar,
}: {
  s: PdpSolicitud;
  now: number;
  ocupada: boolean;
  onReintentar: (s: PdpSolicitud) => void;
  onCancelar: (s: PdpSolicitud) => void;
}) {
  const info = estadoInfo(s.estado);
  const acc = accionesDe(s, now);
  const terminada = Boolean(s.terminada_at);
  const meta = [
    s.creado_por && `Pedida por ${s.creado_por}`,
    terminada ? `Terminó ${hace(s.terminada_at, now)}` : `Pedida ${hace(s.created_at, now)}`,
    (s.intentos ?? 0) > 1 && `${formatNumero(s.intentos)} intentos`,
    s.lote && `Re-check semanal: ${s.lote}`,
    s.ficha_nombre && `Ficha técnica: ${s.ficha_nombre}`,
    s.versiones?.some((v) => v.ficha_file_id) &&
      `Fichas de versión: ${s.versiones.filter((v) => v.ficha_file_id).map((v) => v.nombre).join(", ")}`,
    formatUsd(s.costo_usd) && `Costó ${formatUsd(s.costo_usd)}`,
  ].filter(Boolean) as string[];

  return (
    <li className="flex flex-col gap-3 p-5" data-estado={s.estado}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-h4 font-bold">{nombrePdp(s)}</h3>
            <Badge variant={info.variant}>
              {s.estado === "procesando" && <LoaderCircle className="animate-spin" strokeWidth={1.5} aria-hidden />}
              {info.label}
            </Badge>
          </div>
          {s.estado === "error" ? (
            <p className="text-destructive flex items-start gap-1.5 text-small break-words" data-testid="pdp-razon-error">
              <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
              <span>
                <span className="font-semibold">Razón del error:</span>{" "}
                {s.detalle || "la web no informó la razón. Revisa el aviso completo o la sesión en Console."}
              </span>
            </p>
          ) : (
            s.detalle && (
              <p className="text-muted-foreground line-clamp-2 text-small sm:line-clamp-1" title={s.detalle}>
                {s.detalle}
              </p>
            )
          )}
          {acc.sinTomar && (
            <p className="text-foreground flex items-center gap-1.5 text-small">
              <CircleAlert className="size-4 shrink-0" strokeWidth={1.5} aria-hidden /> Lleva más de 30 min en espera y el flujo no
              la ha tomado: revisa que el workflow de n8n esté activo.
            </p>
          )}
          {acc.pegada && (
            <p className="text-foreground flex items-center gap-1.5 text-small">
              <CircleAlert className="size-4 shrink-0" strokeWidth={1.5} aria-hidden /> Lleva más de 30 min sin avanzar: puedes reintentarla.
            </p>
          )}
          <Versiones s={s} />
          <p className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-micro tabular-nums">
            {meta.map((m, i) => (
              <span key={i} title={i === 1 ? formatFechaHora(terminada ? s.terminada_at : s.created_at) : undefined}>
                {m}
              </span>
            ))}
          </p>
        </div>

        {(acc.studio || acc.cancelar || acc.reintentar || acc.corregir) && (
          <div className="flex shrink-0 flex-wrap gap-2">
            {acc.studio && (
              <Button asChild size="sm">
                <a href={s.studio_url!} target="_blank" rel="noopener noreferrer">
                  Abrir en Studio <ExternalLink strokeWidth={1.5} aria-hidden />
                </a>
              </Button>
            )}
            {acc.corregir && (
              <Button asChild size="sm" variant={acc.studio ? "outline" : "default"}>
                <Link href={`/admin/pdps/${encodeURIComponent(s.id)}/corregir`}>
                  <Pencil strokeWidth={1.5} aria-hidden /> Corregir y reintentar
                </Link>
              </Button>
            )}
            {acc.reintentar && (
              <Button size="sm" variant="outline" disabled={ocupada} onClick={() => onReintentar(s)} className="cursor-pointer">
                {ocupada ? <LoaderCircle className="animate-spin" strokeWidth={1.5} aria-hidden /> : <RotateCcw strokeWidth={1.5} aria-hidden />}
                Reintentar
              </Button>
            )}
            {acc.cancelar && (
              <Button size="sm" variant="outline" disabled={ocupada} onClick={() => onCancelar(s)} className="cursor-pointer">
                <X strokeWidth={1.5} aria-hidden /> Cancelar
              </Button>
            )}
          </div>
        )}
      </div>

      {s.mensaje && (
        <Collapsible>
          <CollapsibleTrigger className="text-link group inline-flex cursor-pointer items-center gap-1 text-small font-semibold underline-offset-4 hover:underline">
            <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" strokeWidth={1.5} aria-hidden />
            <span className="group-data-[state=open]:hidden">Ver el aviso completo</span>
            <span className="hidden group-data-[state=open]:inline">Ocultar el aviso</span>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="bg-muted mt-3 rounded-control border p-4 text-small leading-relaxed break-words whitespace-pre-wrap">{s.mensaje}</div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </li>
  );
}

export function PdpSolicitudes({ inicial, errorInicial, now: nowServidor }: { inicial: PdpSolicitud[]; errorInicial?: string; now: number }) {
  const [items, setItems] = useState(inicial);
  const [now, setNow] = useState(nowServidor);
  const [error, setError] = useState(errorInicial ?? null);
  const [sinPermiso, setSinPermiso] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [actualizada, setActualizada] = useState(nowServidor);
  const [filtro, setFiltro] = useState("todos");
  const [ocupadas, setOcupadas] = useState<Set<string>>(new Set());
  const [aCancelar, setACancelar] = useState<PdpSolicitud | null>(null);
  const enVuelo = useRef(false);
  // Último estado visto de cada una: para avisar cuando una pasa a "error" mientras miras la lista.
  const vistos = useRef(new Map(inicial.map((s) => [s.id, s.estado])));

  const recordar = (lista: PdpSolicitud[]) => {
    for (const s of lista) vistos.current.set(s.id, s.estado);
  };

  const refrescar = useCallback(async () => {
    if (enVuelo.current) return;
    enVuelo.current = true;
    setCargando(true);
    try {
      const res = await listarPdps();
      if (res.ok) {
        const fallidas = res.data.filter((s) => s.estado === "error" && vistos.current.has(s.id) && vistos.current.get(s.id) !== "error");
        recordar(res.data);
        for (const s of fallidas) {
          toast.error(`Falló la PDP ${nombrePdp(s)}`, {
            description: s.detalle || "La web no informó la razón: revisa el aviso completo en la lista.",
            duration: 20_000,
          });
        }
        setItems(res.data);
        setError(null);
      } else {
        setError(res.errores[0] ?? "No se pudo actualizar la lista.");
        if (res.tipo === "no_autorizado" || res.tipo === "config") setSinPermiso(true);
      }
    } catch {
      setError("No se pudo actualizar la lista. Revisa tu conexión.");
    } finally {
      const t = Date.now();
      setNow(t);
      setActualizada(t);
      setCargando(false);
      enVuelo.current = false;
    }
  }, []);

  const activas = items.some(esActiva);

  // Cada 15 s solo mientras haya alguna en curso (y la pestaña esté a la vista).
  useEffect(() => {
    if (!activas || sinPermiso) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void refrescar();
    }, INTERVALO);
    return () => clearInterval(id);
  }, [activas, sinPermiso, refrescar]);

  // Al volver a la pestaña, una consulta (aunque todas hayan terminado).
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && !sinPermiso) void refrescar();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [sinPermiso, refrescar]);

  // El "hace X min" avanza sin pedirle nada a la web.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const marcarOcupada = (id: string, si: boolean) =>
    setOcupadas((prev) => {
      const n = new Set(prev);
      if (si) n.add(id);
      else n.delete(id);
      return n;
    });

  const reemplazar = (s: PdpSolicitud | null, id: string) => {
    if (!s) return;
    recordar([s]);
    setItems((prev) => prev.map((x) => (x.id === id ? s : x)));
  };

  async function reintentar(s: PdpSolicitud) {
    marcarOcupada(s.id, true);
    try {
      const res = await reintentarPdp(s.id);
      if (!res.ok) {
        toast.error("No se pudo reintentar", { description: res.errores.join("\n") });
      } else {
        toast.success("Reintento en cola", { description: `${nombrePdp(s)}. Empieza en menos de 15 min.` });
        reemplazar(res.data.solicitud, s.id);
      }
    } catch {
      toast.error("No se pudo reintentar, intenta de nuevo.");
    } finally {
      marcarOcupada(s.id, false);
      void refrescar();
    }
  }

  async function confirmarCancelar() {
    const s = aCancelar;
    if (!s) return;
    marcarOcupada(s.id, true);
    try {
      const res = await cancelarPdp(s.id);
      if (!res.ok) {
        toast.error("No se pudo cancelar", { description: res.errores.join("\n") });
      } else {
        toast.success("Solicitud cancelada", { description: nombrePdp(s) });
        if (res.data) reemplazar(res.data, s.id);
        else setItems((prev) => prev.filter((x) => x.id !== s.id));
      }
    } catch {
      toast.error("No se pudo cancelar, intenta de nuevo.");
    } finally {
      setACancelar(null);
      marcarOcupada(s.id, false);
      void refrescar();
    }
  }

  const conteo = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of items) m.set(s.estado, (m.get(s.estado) ?? 0) + 1);
    return m;
  }, [items]);
  const estados = [...ORDEN_ESTADOS.filter((e) => conteo.has(e)), ...[...conteo.keys()].filter((e) => !ORDEN_ESTADOS.includes(e as never))];
  const visibles = filtro === "todos" ? items : items.filter((s) => s.estado === filtro);
  const erroresRecientes = items.filter((s) => s.estado === "error" && now - new Date(s.terminada_at ?? s.updated_at ?? s.created_at).getTime() < UN_DIA);
  const sinTomar = items.filter((s) => accionesDe(s, now).sinTomar).length;

  if (items.length === 0 && !error) {
    return (
      <div className="rounded-card border">
        <EmptyState
          icon={CarFront}
          title="Todavía no hay PDPs en creación"
          description="Cuando pidas una ficha nueva, aquí verás cómo avanza la investigación hasta quedar como borrador oculto en Studio."
          action={
            <Button asChild>
              <Link href="/admin/pdps/nueva">
                <Plus strokeWidth={1.5} aria-hidden /> Nueva PDP
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={filtro} onValueChange={setFiltro}>
          <SelectTrigger size="sm" className="w-full sm:w-64" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados ({formatNumero(items.length)})</SelectItem>
            {estados.map((e) => (
              <SelectItem key={e} value={e}>
                {estadoInfo(e).label} ({formatNumero(conteo.get(e))})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <p className="text-muted-foreground text-small" aria-live="polite" data-testid="pdp-refresco">
            {activas && !sinPermiso ? "Se actualiza sola cada 15 s" : "Todas terminaron: no se actualiza sola"}
            <span suppressHydrationWarning>. Revisada {hace(new Date(actualizada).toISOString(), now)}</span>
          </p>
          <Button variant="outline" size="icon-sm" onClick={() => void refrescar()} disabled={cargando} aria-label="Actualizar ahora" className="cursor-pointer">
            <RefreshCw className={cn(cargando && "animate-spin")} strokeWidth={1.5} aria-hidden />
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="border-destructive text-destructive flex items-start gap-2 rounded-control border p-4 text-small">
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
          <span>{error}</span>
        </div>
      )}

      {erroresRecientes.length > 0 && filtro !== "error" && (
        <div role="status" className="border-destructive flex flex-col gap-3 rounded-control border p-4 text-small sm:flex-row sm:items-center sm:justify-between" data-testid="pdp-aviso-errores">
          <p className="text-destructive flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <span>
              {erroresRecientes.length === 1
                ? `${nombrePdp(erroresRecientes[0])} falló en las últimas 24 h.`
                : `${formatNumero(erroresRecientes.length)} solicitudes fallaron en las últimas 24 h.`}{" "}
              La razón está en cada una.
            </span>
          </p>
          <Button variant="outline" size="sm" onClick={() => setFiltro("error")} className="shrink-0 cursor-pointer">
            Ver las con error
          </Button>
        </div>
      )}

      {sinTomar > 0 && (
        <div role="status" className="flex items-start gap-2 rounded-control border p-4 text-small" data-testid="pdp-aviso-sin-tomar">
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden />
          <span>
            {sinTomar === 1 ? "Hay 1 solicitud" : `Hay ${formatNumero(sinTomar)} solicitudes`} en espera hace más de 30 min: el flujo de
            n8n no las está tomando (debería en menos de 15 min). Revisa que el workflow esté activo.
          </span>
        </div>
      )}

      {visibles.length === 0 ? (
        items.length > 0 && (
          <div className="rounded-card border">
            <EmptyState icon={SearchX} title="No hay solicitudes en este estado" action={<Button variant="outline" size="sm" onClick={() => setFiltro("todos")} className="cursor-pointer">Ver todas</Button>} />
          </div>
        )
      ) : (
        <ul className="bg-card divide-y rounded-card border" data-testid="pdp-lista">
          {visibles.map((s) => (
            <Fila key={s.id} s={s} now={now} ocupada={ocupadas.has(s.id)} onReintentar={reintentar} onCancelar={setACancelar} />
          ))}
        </ul>
      )}

      <Dialog open={Boolean(aCancelar)} onOpenChange={(o) => !o && setACancelar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Cancelar esta solicitud?</DialogTitle>
            <DialogDescription>
              {aCancelar ? nombrePdp(aCancelar) : ""}. Todavía no la toma el flujo: si la cancelas, no se investiga y puedes
              volver a pedirla cuando quieras.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setACancelar(null)} className="cursor-pointer">
              Volver
            </Button>
            <Button variant="destructive" onClick={() => void confirmarCancelar()} disabled={aCancelar ? ocupadas.has(aCancelar.id) : false} className="cursor-pointer">
              {aCancelar && ocupadas.has(aCancelar.id) && <LoaderCircle className="animate-spin" strokeWidth={1.5} aria-hidden />}
              Sí, cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
