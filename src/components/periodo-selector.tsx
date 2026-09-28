"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AGRUPACIONES, PRESETS, ymdChile, type PeriodoInfo } from "@/lib/periodo";
import { cn } from "@/lib/utils";

const CAMPO =
  "border-input bg-background text-foreground hover:border-ink-3 h-10 rounded-control border px-3 text-small tabular-nums transition-colors";

/**
 * Selector del período del panel: presets, rango personalizado y agrupación. Escribe en la
 * URL (?periodo=, ?desde=&hasta=, ?agrupar=) para que la vista se pueda compartir; el servidor
 * vuelve a leer los datos del período nuevo.
 */
export function PeriodoSelector({ periodo, className }: { periodo: PeriodoInfo; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [rango, setRango] = useState(periodo.key === "rango");
  const [desde, setDesde] = useState(periodo.desdeYmd ?? "");
  const [hasta, setHasta] = useState(periodo.hastaYmd);
  const [hoy] = useState(() => ymdChile(Date.now()));

  function ir(cambios: Record<string, string | null>) {
    const q = new URLSearchParams(sp?.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v == null) q.delete(k);
      else q.set(k, v);
    }
    const s = q.toString();
    startTransition(() => router.push(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  }

  function elegir(v: string) {
    if (v === "rango") {
      setRango(true);
      if (!desde) setDesde(periodo.desdeYmd ?? periodo.hastaYmd);
      return;
    }
    setRango(false);
    ir({ periodo: v, desde: null, hasta: null });
  }

  function aplicarRango(e: React.FormEvent) {
    e.preventDefault();
    if (!desde || !hasta) return;
    ir({ periodo: null, desde, hasta });
  }

  const agruparLabel = AGRUPACIONES.find((a) => a.key === periodo.agrupar)!.porLabel;

  return (
    <div className={cn("flex flex-col gap-2", className)} aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-2">
        <Select value={rango ? "rango" : periodo.key} onValueChange={elegir} disabled={pending}>
          <SelectTrigger size="sm" aria-label="Período" className="min-w-44">
            <CalendarRange className="text-muted-foreground" strokeWidth={1.5} aria-hidden />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => (
              <SelectItem key={p.key} value={p.key}>
                {p.label}
              </SelectItem>
            ))}
            <SelectSeparator />
            <SelectItem value="rango">Rango personalizado</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={periodo.agruparAuto ? "auto" : periodo.agrupar}
          onValueChange={(v) => ir({ agrupar: v === "auto" ? null : v })}
          disabled={pending}
        >
          <SelectTrigger size="sm" aria-label="Agrupar los gráficos" className="min-w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Automático ({periodo.agruparAuto ? agruparLabel : "según el período"})</SelectItem>
            {AGRUPACIONES.map((a) => (
              <SelectItem key={a.key} value={a.key}>
                {a.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {rango && (
        <form onSubmit={aplicarRango} className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-label">
            <span className="text-muted-foreground">Desde</span>
            <input type="date" required value={desde} max={hasta || hoy} onChange={(e) => setDesde(e.target.value)} className={CAMPO} />
          </label>
          <label className="grid gap-1 text-label">
            <span className="text-muted-foreground">Hasta</span>
            <input type="date" required value={hasta} min={desde || undefined} max={hoy} onChange={(e) => setHasta(e.target.value)} className={CAMPO} />
          </label>
          <Button type="submit" size="sm" variant="outline" disabled={pending || !desde || !hasta} className="cursor-pointer">
            Aplicar
          </Button>
        </form>
      )}
    </div>
  );
}
