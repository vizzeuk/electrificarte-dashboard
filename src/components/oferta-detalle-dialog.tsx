"use client";

import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCLP, formatFecha } from "@/lib/utils";
import type { Oferta } from "@/lib/db/types";

const VERSION_MATCH_LABELS: Record<string, string> = {
  exacta: "Modelo exacto",
  variacion_menor: "Variación menor",
  upgrade: "Versión superior",
  inferior: "Versión más básica",
  no_coincidente: "Modelo alternativo",
};

export function OfertaDetalleDialog({
  oferta,
  open,
  onOpenChange,
}: {
  oferta: Oferta;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const vehiculo =
    [oferta.marca_ofertada, oferta.modelo_ofertado, oferta.anio_ofertado].filter(Boolean).join(" ") || "—";

  // Ahorro frente al precio de lista publicado — el argumento de venta del lead.
  const ahorro =
    oferta.precio_publicado != null && oferta.precio_oferta != null
      ? oferta.precio_publicado - oferta.precio_oferta
      : null;
  const ahorroPct =
    ahorro != null && oferta.precio_publicado
      ? Math.round((ahorro / oferta.precio_publicado) * 100)
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{vehiculo}</DialogTitle>
          <DialogDescription>
            Detalle de tu puja · {formatFecha(oferta.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={oferta.estado ?? "pendiente"} />
          {oferta.color_ofertado && <Badge variant="outline">{oferta.color_ofertado}</Badge>}
          <Badge variant="outline">
            {VERSION_MATCH_LABELS[oferta.version_match ?? ""] ?? "—"}
          </Badge>
        </div>

        {oferta.descalificada && oferta.motivo_descalificacion && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            <span className="font-semibold">Descalificada:</span> {oferta.motivo_descalificacion}
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          <Dato label="Precio ofertado" value={formatCLP(oferta.precio_oferta)} strong />
          <Dato label="Precio de lista" value={formatCLP(oferta.precio_publicado)} />
          <Dato
            label="Ahorro para el cliente"
            value={ahorro != null ? `${formatCLP(ahorro)}${ahorroPct != null ? ` · ${ahorroPct}%` : ""}` : "—"}
            positive={ahorro != null && ahorro > 0}
          />
          <Dato
            label="Entrega"
            value={oferta.horas_entrega != null ? `${oferta.horas_entrega} h` : "—"}
          />
          <Dato
            label="Regalías / beneficios"
            value={oferta.valor_regalias ? formatCLP(oferta.valor_regalias) : "Sin regalías"}
          />
          <Dato
            label="Financiamiento"
            value={oferta.acepta_financiamiento == null ? "—" : oferta.acepta_financiamiento ? "Acepta" : "No acepta"}
          />
          <Dato label="Puntaje" value={oferta.score_total != null ? String(Math.round(oferta.score_total)) : "Sin evaluar"} />
          {oferta.cercania_zona && <Dato label="Cercanía de zona" value={oferta.cercania_zona} />}
        </dl>

        {oferta.regalias_descripcion ? (
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-muted-foreground text-xs">Qué incluyen las regalías</p>
            <p className="text-sm">{oferta.regalias_descripcion}</p>
          </div>
        ) : null}

        {oferta.score_desglose && Object.keys(oferta.score_desglose).length > 0 && (
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground mb-2 text-xs">Cómo se compone tu puntaje</p>
            <dl className="grid gap-1.5">
              {Object.entries(oferta.score_desglose).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-sm">
                  <dt className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</dt>
                  <dd className="font-medium tabular-nums">{Math.round(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <Timeline oferta={oferta} />

        <p className="text-muted-foreground text-xs">
          El puntaje y el resultado los define el sistema al evaluar tu puja frente a las del resto de la red.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/** Ciclo de vida de la puja. Cada paso se marca hecho cuando su timestamp existe;
 *  los que faltan quedan como "pendiente" — comunica el estado real sin inventar nada. */
function Timeline({ oferta }: { oferta: Oferta }) {
  const pasos = [
    { label: "Puja enviada", at: oferta.created_at },
    { label: "Enviada al cliente", at: oferta.enviada_cliente_at ?? null },
    { label: "Respondida por el cliente", at: oferta.respondida_at ?? null },
    { label: "Aceptada", at: oferta.aceptada_at ?? null },
  ];
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground mb-3 text-xs">Seguimiento</p>
      <ol className="grid gap-3">
        {pasos.map((p) => {
          const hecho = !!p.at;
          return (
            <li key={p.label} className="flex items-center gap-3">
              <span
                className={[
                  "size-2.5 shrink-0 rounded-full",
                  hecho ? "bg-primary" : "bg-muted-foreground/25",
                ].join(" ")}
              />
              <span className={hecho ? "text-sm font-medium" : "text-muted-foreground text-sm"}>
                {p.label}
              </span>
              <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                {hecho ? formatFecha(p.at) : "pendiente"}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Dato({
  label,
  value,
  strong,
  positive,
}: {
  label: string;
  value: string;
  strong?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd
        className={[
          "tabular-nums",
          strong ? "text-base font-semibold" : "text-sm font-medium",
          positive ? "text-emerald-600 dark:text-emerald-400" : "",
        ].join(" ")}
      >
        {value}
      </dd>
    </div>
  );
}
