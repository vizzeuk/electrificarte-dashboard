import { cn } from "@/lib/utils";

const COLS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
  5: "sm:grid-cols-3 lg:grid-cols-5",
};

/**
 * Fila de cifras del sistema v1 (como `.kpis` de la web): cada cifra abre con una hairline,
 * número en Switzer 600 tabular, etiqueta en Grafito. Sin cards, sin íconos, sin colores.
 */
export function Kpis({
  children,
  cols = 4,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  return <div className={cn("grid grid-cols-2 gap-x-6 gap-y-6", COLS[cols], className)}>{children}</div>;
}

export function Kpi({
  value,
  label,
  hint,
  className,
}: {
  value: React.ReactNode;
  label: string;
  hint?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 border-t pt-4", className)}>
      <p className="text-price-lg leading-none font-semibold tracking-[-0.02em] tabular-nums">{value}</p>
      <p className="mt-2 text-small font-medium">{label}</p>
      {hint && <p className="text-muted-foreground mt-0.5 text-micro">{hint}</p>}
    </div>
  );
}
