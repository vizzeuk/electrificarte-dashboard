"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { crearOferta } from "@/app/vendedor/leads-disponibles/actions";
import type { PoolLead, VersionMatch } from "@/lib/db/types";

/** "BYD Dolphin GLX" → { marca: "BYD", modelo: "Dolphin GLX" } */
function parseModelo(target: string | null): { marca: string; modelo: string } {
  if (!target) return { marca: "", modelo: "" };
  const t = target.trim();
  const sp = t.indexOf(" ");
  if (sp === -1) return { marca: t, modelo: "" };
  return { marca: t.slice(0, sp), modelo: t.slice(sp + 1) };
}

// La alternativa deriva el version_match; no lo elige el vendedor a mano.
const COMPARACION: { value: VersionMatch; label: string }[] = [
  { value: "upgrade", label: "Superior" },
  { value: "variacion_menor", label: "Similar" },
  { value: "inferior", label: "Más básica" },
];

export function OfertarDialog({ lead }: { lead: PoolLead }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const pedido = parseModelo(lead.target_model);
  const tieneModeloPedido = !!lead.target_model;

  const [precio, setPrecio] = useState("");
  const [horas, setHoras] = useState("48");
  const [anio, setAnio] = useState("");
  const [color, setColor] = useState("");
  const [aceptaFin, setAceptaFin] = useState(false);
  const [regalias, setRegalias] = useState("");

  // Alternativa (solo si no tiene el modelo exacto). Si el lead no trae modelo
  // pedido, se ofrece libre desde el arranque.
  const [alternativa, setAlternativa] = useState(!tieneModeloPedido);
  const [altMarca, setAltMarca] = useState("");
  const [altModelo, setAltModelo] = useState("");
  const [comparacion, setComparacion] = useState<VersionMatch>("variacion_menor");

  function reset() {
    setPrecio("");
    setHoras("48");
    setAnio("");
    setColor("");
    setAceptaFin(false);
    setRegalias("");
    setAlternativa(!tieneModeloPedido);
    setAltMarca("");
    setAltModelo("");
    setComparacion("variacion_menor");
  }

  function handleSubmit() {
    const usaAlternativa = alternativa || !tieneModeloPedido;
    const marca = usaAlternativa ? altMarca : pedido.marca;
    const modelo = usaAlternativa ? altModelo : pedido.modelo;
    // version_match: exacta si ofrece el modelo pedido; si es alternativa, la
    // comparación elegida. Sin modelo pedido, no hay contra qué comparar.
    const versionMatch: VersionMatch = !tieneModeloPedido
      ? "no_coincidente"
      : usaAlternativa
        ? comparacion
        : "exacta";

    startTransition(async () => {
      const res = await crearOferta({
        lead_id: lead.id,
        precio_oferta: Number(precio),
        horas_entrega: Number(horas),
        version_match: versionMatch,
        acepta_financiamiento: aceptaFin,
        valor_regalias: Number(regalias) || 0,
        marca_ofertada: marca,
        modelo_ofertado: modelo,
        anio_ofertado: Number(anio),
        color_ofertado: color || null,
      });

      if (!res.ok) {
        toast.error("No se pudo enviar la oferta", { description: res.error });
        return;
      }
      toast.success("Oferta enviada", {
        description: "Tu puja quedó en evaluación. Vas a ver su estado en “Mis ofertas”.",
      });
      reset();
      setOpen(false);
    });
  }

  const ubicacion = [lead.comuna, lead.region].filter(Boolean).join(", ");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          Ofertar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ofertar</DialogTitle>
          <DialogDescription>
            {ubicacion ? `${ubicacion} · ` : ""}Ingresá tu puja para este lead.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          {/* Vehículo que pidió el cliente — prioridad */}
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="text-muted-foreground text-xs">El cliente busca</p>
            <p className="text-base font-semibold">
              {lead.target_model || "No especificó un modelo"}
            </p>
            {tieneModeloPedido && (
              <label className="mt-3 flex items-start gap-2 text-sm">
                <Checkbox
                  checked={alternativa}
                  onCheckedChange={(v) => setAlternativa(v === true)}
                  className="mt-0.5 cursor-pointer"
                />
                <span className="cursor-pointer">
                  No tengo ese modelo exacto — ofrezco una alternativa parecida
                </span>
              </label>
            )}
          </div>

          {/* Alternativa: recién acá se declara otro vehículo */}
          {(alternativa || !tieneModeloPedido) && (
            <div className="grid gap-3 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="alt-marca">Marca</Label>
                  <Input id="alt-marca" placeholder="BYD" value={altMarca} onChange={(e) => setAltMarca(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="alt-modelo">Modelo</Label>
                  <Input id="alt-modelo" placeholder="Dolphin" value={altModelo} onChange={(e) => setAltModelo(e.target.value)} />
                </div>
              </div>
              {tieneModeloPedido && (
                <div className="grid gap-1.5">
                  <Label>Comparada con lo que pidió</Label>
                  <ToggleGroup
                    type="single"
                    value={comparacion}
                    onValueChange={(v) => v && setComparacion(v as VersionMatch)}
                    className="justify-start"
                  >
                    {COMPARACION.map((c) => (
                      <ToggleGroupItem key={c.value} value={c.value} className="cursor-pointer px-3">
                        {c.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-1.5">
            <Label htmlFor="precio">Precio ofertado (CLP)</Label>
            <Input
              id="precio"
              inputMode="numeric"
              placeholder="Ej: 21500000"
              value={precio}
              onChange={(e) => setPrecio(e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="anio">Año del vehículo</Label>
              <Input
                id="anio"
                inputMode="numeric"
                placeholder="2025"
                value={anio}
                onChange={(e) => setAnio(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="color">Color (opcional)</Label>
              <Input id="color" placeholder="Blanco" value={color} onChange={(e) => setColor(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="horas">Horas de entrega (≤96)</Label>
              <Input
                id="horas"
                inputMode="numeric"
                placeholder="48"
                value={horas}
                onChange={(e) => setHoras(e.target.value.replace(/\D/g, "").slice(0, 3))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="regalias">Regalías (CLP, opcional)</Label>
              <Input
                id="regalias"
                inputMode="numeric"
                placeholder="0"
                value={regalias}
                onChange={(e) => setRegalias(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="acepta-fin" className="cursor-pointer">Acepto financiamiento</Label>
              <p className="text-muted-foreground text-xs">
                {lead.financing ? `El cliente indicó: ${lead.financing}` : "Método de pago no informado"}
              </p>
            </div>
            <Switch id="acepta-fin" checked={aceptaFin} onCheckedChange={setAceptaFin} className="cursor-pointer" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer" disabled={pending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="cursor-pointer" disabled={pending}>
            {pending ? "Enviando…" : "Confirmar oferta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
