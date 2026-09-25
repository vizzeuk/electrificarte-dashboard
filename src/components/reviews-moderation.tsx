"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import {
  Star,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
  Mail,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { aprobarResena, rechazarResena } from "@/app/admin/resenas/actions";
import { cn, formatFecha } from "@/lib/utils";
import type { PendingReview } from "@/lib/data/reviews-data";

const SITE = "https://www.electrificarte.com";

export function ReviewsModeration({ reviews }: { reviews: PendingReview[] }) {
  const [items, setItems] = useState(reviews);
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => setNow(Date.now()), []);

  const current = items[index];

  const removeCurrent = useCallback(() => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== index);
      setIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
      return next;
    });
  }, [index]);

  const aprobar = useCallback(() => {
    if (!current || pending) return;
    const id = current.id;
    startTransition(async () => {
      const res = await aprobarResena(id);
      if (!res.ok) {
        toast.error("No se pudo aprobar", { description: res.error });
        return;
      }
      if (res.aviso) toast.warning("Aprobada con aviso", { description: res.aviso });
      else toast.success("Reseña aprobada y publicada");
      removeCurrent();
    });
  }, [current, pending, removeCurrent]);

  const confirmarRechazo = useCallback(() => {
    if (!current || pending) return;
    const id = current.id;
    const razon = motivo;
    startTransition(async () => {
      const res = await rechazarResena(id, razon);
      if (!res.ok) {
        toast.error("No se pudo rechazar", { description: res.error });
        return;
      }
      toast.success("Reseña rechazada");
      setRejectOpen(false);
      setMotivo("");
      removeCurrent();
    });
  }, [current, pending, motivo, removeCurrent]);

  const siguiente = useCallback(() => setIndex((i) => Math.min(i + 1, items.length - 1)), [items.length]);
  const anterior = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  // Atajos de teclado: A aprobar · R rechazar · ← → navegar. Se ignoran si el foco está en un
  // campo de texto (p. ej. el motivo de rechazo) o si hay una acción en curso.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (rejectOpen || pending || !current) return;
      const k = e.key.toLowerCase();
      if (k === "a") { e.preventDefault(); aprobar(); }
      else if (k === "r") { e.preventDefault(); setRejectOpen(true); }
      else if (e.key === "ArrowRight") { e.preventDefault(); siguiente(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); anterior(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aprobar, siguiente, anterior, rejectOpen, pending, current]);

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Check className="size-6" />
          </div>
          <p className="font-display text-lg font-semibold">No hay reseñas con fotos por moderar</p>
          <p className="text-muted-foreground text-sm">Las reseñas sin fotos se publican solas: las ves en la lista de abajo.</p>
        </CardContent>
      </Card>
    );
  }

  if (!current) return null;

  const nombre = [current.first_name, current.last_name].filter(Boolean).join(" ") || "Anónimo";
  const auto = [current.car_brand, current.car_model, current.car_year].filter(Boolean).join(" ");
  const detalleAuto = [current.car_version, current.car_color].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de navegación de la cola */}
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm tabular-nums">
          Reseña {index + 1} de {items.length}
        </span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={anterior} disabled={index === 0} className="cursor-pointer">
            <ChevronLeft className="size-4" /> Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={siguiente} disabled={index >= items.length - 1} className="cursor-pointer">
            Siguiente <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6">
          {/* Encabezado: rating + auto + fecha */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-5",
                      i < (current.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
                    )}
                  />
                ))}
                <span className="text-muted-foreground ml-2 text-sm tabular-nums">{current.rating ?? "—"}/5</span>
              </div>
              <div className="font-display text-xl font-semibold">{auto || "Auto sin identificar"}</div>
              {detalleAuto && <div className="text-muted-foreground text-sm">{detalleAuto}</div>}
            </div>
            <div className="flex flex-col items-end gap-1 text-sm">
              <span className="text-muted-foreground" suppressHydrationWarning>
                {formatFecha(current.created_at)}
                {now && current.created_at ? ` · ${hace(current.created_at, now)}` : ""}
              </span>
              {current.source && <Badge variant="outline">Origen: {current.source}</Badge>}
              {current.car_slug && (
                <a
                  href={`${SITE}/auto/${current.car_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  Ver el auto <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Texto de la reseña — completo, sin truncar */}
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {current.body || <span className="text-muted-foreground italic">Sin texto</span>}
          </p>

          {/* Fotos EN GRANDE */}
          {current.fotos.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {current.fotos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto ${i + 1} de la reseña`}
                    className="bg-muted max-h-[70vh] w-full rounded-xl border object-contain"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sin fotos.</p>
          )}

          {/* Autor (PII — solo admin) */}
          <div className="bg-muted/40 grid gap-2 rounded-xl border p-4 sm:grid-cols-3">
            <div className="grid gap-0.5">
              <span className="text-muted-foreground text-xs">Autor</span>
              <span className="font-medium">{nombre}</span>
            </div>
            {current.email && (
              <a href={`mailto:${current.email}`} className="grid gap-0.5 hover:underline">
                <span className="text-muted-foreground inline-flex items-center gap-1 text-xs"><Mail className="size-3" /> Email</span>
                <span className="font-medium">{current.email}</span>
              </a>
            )}
            {current.phone && (
              <a href={`tel:${current.phone}`} className="grid gap-0.5 hover:underline">
                <span className="text-muted-foreground inline-flex items-center gap-1 text-xs"><Phone className="size-3" /> Teléfono</span>
                <span className="font-medium">{current.phone}</span>
              </a>
            )}
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={aprobar}
              disabled={pending}
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Check className="size-4" /> Aprobar
            </Button>
            <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={pending} className="cursor-pointer">
              <X className="size-4" /> Rechazar
            </Button>
            <span className="text-muted-foreground ml-auto hidden text-xs sm:block">
              Atajos: <kbd className="rounded border px-1">A</kbd> aprobar ·{" "}
              <kbd className="rounded border px-1">R</kbd> rechazar ·{" "}
              <kbd className="rounded border px-1">→</kbd> siguiente
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de rechazo */}
      <Dialog open={rejectOpen} onOpenChange={(o) => { setRejectOpen(o); if (!o) setMotivo(""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar reseña</DialogTitle>
            <DialogDescription>
              El motivo es opcional y queda registrado internamente (no se muestra al autor).
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            rows={3}
            placeholder="Motivo (opcional): foto no corresponde, contenido inapropiado, etc."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={pending} className="cursor-pointer">
              Cancelar
            </Button>
            <Button
              onClick={confirmarRechazo}
              disabled={pending}
              className="cursor-pointer bg-red-600 text-white hover:bg-red-700"
            >
              {pending ? "Rechazando…" : "Confirmar rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function hace(iso: string, now: number): string {
  const ms = now - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} día${d === 1 ? "" : "s"}`;
}
