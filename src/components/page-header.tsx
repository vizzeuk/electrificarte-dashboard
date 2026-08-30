import { cn } from "@/lib/utils";

/**
 * Encabezado de sección — título grande en la fuente display (Space Grotesk) +
 * subtítulo. Da el ritmo visual de "sección que respira" del sitio.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-1">
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
