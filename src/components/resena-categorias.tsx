import { cn } from "@/lib/utils";

// Piezas de la reseña con el formulario del 27-sep: notas por categoría y "lo bueno / lo que
// mejoraría". Las reseñas antiguas no las traen: en ese caso no se dibuja nada.

type ConCategorias = {
  rating_autonomia?: number | null;
  rating_confort?: number | null;
  rating_agilidad?: number | null;
  rating_calidad?: number | null;
  pros?: string | null;
  contras?: string | null;
};

const CATS = [
  { key: "rating_autonomia", label: "Autonomía" },
  { key: "rating_confort", label: "Confort" },
  { key: "rating_agilidad", label: "Agilidad" },
  { key: "rating_calidad", label: "Calidad" },
] as const;

/** Nota con un decimal en formato chileno: 4.3 → "4,3". */
export function formatNota(n: number | null | undefined): string {
  if (n == null) return "Sin nota";
  return n.toLocaleString("es-CL", { minimumFractionDigits: Number.isInteger(n) ? 0 : 1, maximumFractionDigits: 1 });
}

export function tieneCategorias(r: ConCategorias): boolean {
  return CATS.some((c) => r[c.key] != null);
}

/** "Autonomía 5, Confort 4…" para el CSV. */
export function categoriasTexto(r: ConCategorias): string {
  return CATS.filter((c) => r[c.key] != null).map((c) => `${c.label} ${r[c.key]}`).join(", ");
}

/** Las cuatro categorías con una barra de 1 a 5 (Laguna sobre Niebla). */
export function CategoriasResena({ r, className }: { r: ConCategorias; className?: string }) {
  if (!tieneCategorias(r)) return null;
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4", className)}>
      {CATS.map((c) => {
        const v = r[c.key];
        return (
          <div key={c.key} className="grid gap-1.5">
            <div className="flex items-baseline justify-between gap-2 text-small">
              <dt className="text-muted-foreground">{c.label}</dt>
              <dd className="font-semibold tabular-nums">{v == null ? "Sin nota" : `${v} de 5`}</dd>
            </div>
            <div className="bg-muted h-1.5 overflow-hidden rounded-chip" aria-hidden>
              {v != null && <div className="bg-primary h-full rounded-chip" style={{ width: `${(v / 5) * 100}%` }} />}
            </div>
          </div>
        );
      })}
    </dl>
  );
}

/** "Lo bueno" y "Lo que mejoraría", si la persona los escribió. */
export function ProsContras({ r, className }: { r: ConCategorias; className?: string }) {
  if (!r.pros && !r.contras) return null;
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {r.pros && (
        <div className="grid content-start gap-1 border-t pt-3">
          <p className="text-muted-foreground text-label">Lo bueno</p>
          <p className="text-small leading-relaxed whitespace-pre-wrap">{r.pros}</p>
        </div>
      )}
      {r.contras && (
        <div className="grid content-start gap-1 border-t pt-3">
          <p className="text-muted-foreground text-label">Lo que mejoraría</p>
          <p className="text-small leading-relaxed whitespace-pre-wrap">{r.contras}</p>
        </div>
      )}
    </div>
  );
}
