"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, X, ChevronRight, ChevronLeft, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Estrellas } from "@/components/estrellas";
import { MailLink, OutLink, WhatsAppLink } from "@/components/contact-links";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { aprobarResena, rechazarResena } from "@/app/admin/resenas/actions";
import { formatFecha, SITIO } from "@/lib/utils";
import { fuenteLabel } from "@/lib/labels";
import type { PendingReview } from "@/lib/data/reviews-data";

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

  // Atajos de teclado: A aprobar, R rechazar, flechas para navegar. Se ignoran si el foco está en un
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
      <div className="rounded-card border">
        <EmptyState
          icon={Check}
          title="No hay reseñas con fotos por moderar"
          description="Las reseñas sin fotos se publican solas: las ves en la lista de abajo."
        />
      </div>
    );
  }

  if (!current) return null;

  const nombre = [current.first_name, current.last_name].filter(Boolean).join(" ") || "Anónimo";
  const auto = [current.car_brand, current.car_model, current.car_year].filter(Boolean).join(" ");
  const detalleAuto = [current.car_version, current.car_color].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de navegación de la cola */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-small tabular-nums">
          Reseña {index + 1} de {items.length}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={anterior} disabled={index === 0} className="cursor-pointer">
            <ChevronLeft strokeWidth={1.5} /> Anterior
          </Button>
          <Button variant="outline" size="sm" onClick={siguiente} disabled={index >= items.length - 1} className="cursor-pointer">
            Siguiente <ChevronRight strokeWidth={1.5} />
          </Button>
        </div>
      </div>

      <article className="bg-card flex flex-col gap-6 rounded-card border p-5 sm:p-6">
        {/* Encabezado: nota, auto y fecha */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <Estrellas n={current.rating} className="[&_svg]:size-5" />
              <span className="text-muted-foreground text-small tabular-nums">{current.rating ?? 0} de 5</span>
            </div>
            <h3 className="font-display text-h3 font-bold">{auto || "Auto sin identificar"}</h3>
            {detalleAuto && <p className="text-muted-foreground text-small">{detalleAuto}</p>}
          </div>
          <div className="flex flex-col items-start gap-2 text-small sm:items-end">
            <span className="text-muted-foreground tabular-nums" suppressHydrationWarning>
              {formatFecha(current.created_at)}
              {now && current.created_at ? `, ${hace(current.created_at, now)}` : ""}
            </span>
            {current.source && <Badge variant="outline">Desde {fuenteLabel(current.source).toLocaleLowerCase("es-CL")}</Badge>}
            {current.car_slug && <OutLink href={`${SITIO}/auto/${current.car_slug}`}>Ver el auto en el sitio</OutLink>}
          </div>
        </div>

        {/* Texto de la reseña, completo */}
        <p className="max-w-prose text-base leading-relaxed whitespace-pre-wrap">
          {current.body || <span className="text-muted-foreground">Sin texto</span>}
        </p>

        {/* Fotos en grande */}
        {current.fotos.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {current.fotos.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Foto ${i + 1} de la reseña`}
                  className="bg-muted max-h-[70vh] w-full rounded-card border object-contain"
                />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground inline-flex items-center gap-2 text-small">
            <ImageOff className="size-4" strokeWidth={1.5} aria-hidden /> Esta reseña no trae fotos.
          </p>
        )}

        {/* Autor (datos personales, solo admin) */}
        <dl className="bg-muted dark:bg-background grid gap-4 rounded-card p-4 sm:grid-cols-3">
          <div className="grid gap-1">
            <dt className="text-muted-foreground text-label">Autor</dt>
            <dd className="text-small font-semibold">{nombre}</dd>
          </div>
          {current.email && (
            <div className="grid min-w-0 gap-1">
              <dt className="text-muted-foreground text-label">Email</dt>
              <dd className="min-w-0 text-small"><MailLink email={current.email} /></dd>
            </div>
          )}
          {current.phone && (
            <div className="grid gap-1">
              <dt className="text-muted-foreground text-label">Teléfono</dt>
              <dd className="text-small"><WhatsAppLink phone={current.phone} /></dd>
            </div>
          )}
        </dl>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3 border-t pt-5">
          <Button onClick={aprobar} disabled={pending} className="cursor-pointer">
            <Check strokeWidth={1.5} /> Aprobar y publicar
          </Button>
          <Button variant="outline" onClick={() => setRejectOpen(true)} disabled={pending} className="cursor-pointer">
            <X strokeWidth={1.5} /> Rechazar
          </Button>
          <span className="text-muted-foreground ml-auto hidden text-micro lg:block">
            Atajos: <Kbd>A</Kbd> aprobar, <Kbd>R</Kbd> rechazar, <Kbd>←</Kbd> <Kbd>→</Kbd> navegar
          </span>
        </div>
      </article>

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
            <Button variant="destructive" onClick={confirmarRechazo} disabled={pending} className="cursor-pointer">
              {pending ? "Rechazando…" : "Confirmar rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="bg-background text-foreground rounded-chip border px-1.5 py-0.5 font-sans text-micro">{children}</kbd>;
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
