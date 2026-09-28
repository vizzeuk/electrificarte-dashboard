import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCifra, variacion, type Cifra } from "@/lib/series";
import { cn } from "@/lib/utils";

/**
 * Variación contra el período anterior. Sube = chip Glaciar suave; baja = contorno; igual =
 * gris. La dirección va con flecha y texto, nunca solo con color.
 */
export function DeltaBadge({ cifra, className }: { cifra: Cifra; className?: string }) {
  const v = variacion(cifra);
  if (!v) return null;
  const Icon = v.signo > 0 ? ArrowUp : v.signo < 0 ? ArrowDown : Minus;
  return (
    <Badge variant={v.signo > 0 ? "soft" : v.signo < 0 ? "outline" : "secondary"} className={className} aria-label={v.aria} title={v.aria}>
      <Icon strokeWidth={2} aria-hidden />
      <span className="tabular-nums">{v.texto}</span>
    </Badge>
  );
}

/** Texto de la comparación: "8 vs. 5 en los 30 días anteriores". */
export function textoAnterior(cifra: Cifra, comparacion: string | null): string | null {
  if (!cifra.compara || !comparacion) return null;
  const ant = formatCifra({ actual: cifra.anterior, formato: cifra.formato }, "sin datos");
  return `${ant} ${comparacion.replace(/^vs\. /, "en ")}`;
}

/**
 * Cifra del panel con su variación (hairline arriba, como `.kpi` de la web). Sirve en servidor
 * y en cliente: no recibe funciones.
 */
export function CifraKpi({
  label,
  cifra,
  comparacion,
  hint,
  vacio,
  className,
}: {
  label: string;
  cifra: Cifra;
  /** "vs. los 30 días anteriores" (del período). */
  comparacion: string | null;
  hint?: React.ReactNode;
  vacio?: string;
  className?: string;
}) {
  const t = textoAnterior(cifra, comparacion);
  const ant = t ? t.charAt(0).toLocaleUpperCase("es-CL") + t.slice(1) : null;
  return (
    <div className={cn("flex min-w-0 flex-col border-t pt-4", className)}>
      {/* Mismo orden que Kpi (cifra, etiqueta, nota) para que convivan en una fila. */}
      <div className="flex min-h-8 flex-wrap items-center gap-2">
        {cifra.actual == null ? (
          <p className="text-muted-foreground text-h4 font-semibold">{vacio ?? "Sin datos"}</p>
        ) : (
          <p className="text-price-lg leading-none font-semibold tracking-[-0.02em] tabular-nums">{formatCifra(cifra)}</p>
        )}
        <DeltaBadge cifra={cifra} />
      </div>
      <p className="mt-2 text-small font-medium">{label}</p>
      {(ant || hint) && (
        <p className="text-muted-foreground mt-0.5 text-micro">
          {ant}
          {ant && hint ? ". " : ""}
          {hint}
        </p>
      )}
    </div>
  );
}
