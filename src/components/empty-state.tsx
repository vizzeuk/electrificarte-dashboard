import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estado vacío: ícono suelto, una frase que explica y, si aplica, qué hacer. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2 px-5 py-14 text-center", className)}>
      {Icon && <Icon className="text-muted-foreground mb-1 size-7" strokeWidth={1.5} aria-hidden />}
      <p className="text-h4 font-semibold">{title}</p>
      {description && <p className="text-muted-foreground max-w-md text-small">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
