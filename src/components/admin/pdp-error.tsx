import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Cuando la web no responde al abrir el formulario (opciones o la solicitud a corregir). */
export function ErrorOpciones({ mensaje }: { mensaje: string }) {
  return (
    <div role="alert" className="border-destructive flex max-w-3xl flex-col gap-3 rounded-card border p-5">
      <p className="text-destructive flex items-center gap-2 font-semibold">
        <CircleAlert className="size-5" strokeWidth={1.5} aria-hidden /> No se pudo abrir el formulario
      </p>
      <p className="text-small">{mensaje}</p>
      <div className="flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/pdps">Volver a la lista</Link>
        </Button>
      </div>
    </div>
  );
}

