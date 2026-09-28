"use client";

import { DeltaBadge } from "@/components/cifra-kpi";
import { SerieChart } from "@/components/serie-chart";
import { formatCifra, type Cifra, type Tramo } from "@/lib/series";

export interface CategoriaSerie {
  key: string;
  label: string;
  cifra: Cifra;
  serie: (number | null)[];
}

/**
 * Nota por categoría de las reseñas (Autonomía, Confort, Agilidad, Calidad) en el tiempo.
 * Cuatro gráficos chicos con la misma escala (1 a 5) en vez de cuatro líneas encimadas: se
 * comparan de un vistazo y ninguna depende del color para leerse.
 */
export function CategoriasChart({
  categorias,
  tramos,
  hayCategorias,
}: {
  categorias: CategoriaSerie[];
  tramos: Tramo[];
  hayCategorias: boolean;
}) {
  if (!hayCategorias) {
    return (
      <p className="bg-muted text-muted-foreground rounded-control p-4 text-small">
        Ninguna reseña del período trae notas por categoría. Las categorías llegan con el formulario nuevo
        (migración del 27 de septiembre); las reseñas anteriores solo tienen la nota general.
      </p>
    );
  }
  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      {categorias.map((c) => (
        <div key={c.key} className="flex min-w-0 flex-col gap-2 border-t pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-small font-medium">{c.label}</p>
            <p className="ml-auto text-small font-semibold tabular-nums">{formatCifra(c.cifra, "Sin notas")}</p>
            <DeltaBadge cifra={c.cifra} />
          </div>
          <SerieChart
            tramos={tramos}
            series={[{ key: c.key.replace("rating_", ""), label: c.label, data: c.serie, color: "var(--chart-1)" }]}
            tipo="linea"
            formato="nota"
            altura={120}
            vacio="Sin notas en este período."
          />
        </div>
      ))}
    </div>
  );
}
