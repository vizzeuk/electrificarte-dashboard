"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { LeadOferta } from "@/lib/mock/types";

export function OfertarDialog({ lead, onConfirm }: { lead: LeadOferta; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  const [precio, setPrecio] = useState("");

  function handleConfirm() {
    setOpen(false);
    setPrecio("");
    toast.success(`Oferta enviada a ${lead.nombre}`, {
      description: precio ? `Precio ofertado: $${precio} CLP` : undefined,
    });
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="cursor-pointer">
          Ofertar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ofertar a {lead.nombre}</DialogTitle>
          <DialogDescription>
            {lead.auto} · {lead.comuna}, {lead.region} — esta es una simulación, no se envía nada real.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
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
          <div className="grid gap-1.5">
            <Label htmlFor="nota">Nota para el cliente (opcional)</Label>
            <Textarea id="nota" placeholder="Ej: incluye bono por pago al contado..." rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="cursor-pointer">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="cursor-pointer">
            Confirmar oferta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
