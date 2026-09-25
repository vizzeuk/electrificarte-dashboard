import { cn } from "@/lib/utils";

/**
 * Encabezado de página del panel. El título abre la sección (Cabinet Grotesk, sin eyebrow);
 * la bajada es una línea en Grafito. `chips` va arriba del título (p. ej. "En pausa").
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  chips,
  className,
}: {
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  chips?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {chips && <div className="mb-3 flex flex-wrap gap-2">{chips}</div>}
        <h1 className="font-display text-stat leading-[1.04] font-bold tracking-[-0.024em]">{title}</h1>
        {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Título de un bloque dentro de la página (22 px, Cabinet). */
export function SectionTitle({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 className="font-display text-h3 font-bold">{title}</h2>
        {description && <p className="text-muted-foreground mt-1 text-small">{description}</p>}
      </div>
      {action}
    </div>
  );
}
