"use client";

import { useMemo, useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { actualizarMisDatos, type MisDatosInput } from "@/app/vendedor/mi-cuenta/actions";
import { MARCAS, parseMarcasSeleccionadas } from "@/lib/marcas";
import { cn } from "@/lib/utils";
import type { VendorRow } from "@/lib/auth/vendor";

const CAMPOS: { key: keyof MisDatosInput; label: string; placeholder?: string; ancho?: "full" }[] = [
  { key: "nombre", label: "Nombre" },
  { key: "apellido", label: "Apellido" },
  { key: "nombre_concesionario", label: "Nombre del comercio", ancho: "full" },
  { key: "telefono", label: "Teléfono", placeholder: "+56 9 ..." },
  { key: "region", label: "Región" },
  { key: "comuna", label: "Comuna" },
];

const CONTACTO_EMAIL = "contacto@electrificarte.com";

export function MiCuentaForm({ vendor }: { vendor: VendorRow }) {
  const inicial = useMemo<MisDatosInput>(
    () => ({
      nombre: vendor.nombre ?? "",
      apellido: vendor.apellido ?? "",
      nombre_concesionario: vendor.nombre_concesionario ?? "",
      telefono: vendor.telefono ?? "",
      region: vendor.region ?? "",
      comuna: vendor.comuna ?? "",
      marcas: vendor.marcas ?? "",
    }),
    [vendor],
  );

  const [form, setForm] = useState<MisDatosInput>(inicial);
  const [pending, startTransition] = useTransition();
  const [marcasOpen, setMarcasOpen] = useState(false);

  const marcasSel = useMemo(() => new Set(parseMarcasSeleccionadas(form.marcas)), [form.marcas]);
  const marcasInicial = useMemo(() => parseMarcasSeleccionadas(inicial.marcas).join("|"), [inicial.marcas]);

  const cambios = useMemo(() => {
    const keys = Object.keys(inicial) as (keyof MisDatosInput)[];
    return keys.filter((k) => {
      if (k === "marcas") return parseMarcasSeleccionadas(form.marcas).join("|") !== marcasInicial;
      return (form[k] ?? "") !== (inicial[k] ?? "");
    });
  }, [form, inicial, marcasInicial]);
  const hayCambios = cambios.length > 0;

  function set(key: keyof MisDatosInput, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleMarca(marca: string, on: boolean) {
    const next = new Set(marcasSel);
    if (on) next.add(marca);
    else next.delete(marca);
    // Guarda en el orden canónico del catálogo para que quede estable.
    setForm((f) => ({ ...f, marcas: MARCAS.filter((m) => next.has(m)).join(", ") }));
  }

  function guardar() {
    if (!hayCambios) return;
    const patch: MisDatosInput = {};
    for (const k of cambios) patch[k] = form[k];
    startTransition(async () => {
      const res = await actualizarMisDatos(patch);
      if (!res.ok) {
        toast.error("No se pudieron guardar los cambios", { description: res.error });
        return;
      }
      toast.success("Datos actualizados");
    });
  }

  const mailtoEliminar = `mailto:${CONTACTO_EMAIL}?subject=${encodeURIComponent(
    "Solicitud de eliminación de datos",
  )}&body=${encodeURIComponent(
    `Hola, solicito la eliminación de mis datos personales del panel de vendedores.\n\nCuenta: ${vendor.email ?? ""}\nComercio: ${vendor.nombre_concesionario ?? ""}\n\nGracias.`,
  )}`;

  const estadoActivo = (vendor.estado ?? "").toLowerCase() === "activo";

  return (
    <div className="flex flex-col gap-6">
      {/* Identidad — no editable por el vendedor */}
      <Card>
        <CardHeader>
          <CardTitle>Identidad y suscripción</CardTitle>
          <CardDescription>
            Estos datos identifican tu cuenta y los administra Electrificarte. Si algo está mal, escribinos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <ReadOnly label="Correo" value={vendor.email} />
          <ReadOnly label="RUT" value={vendor.rut_vendors} />
          <div className="grid gap-1.5">
            <span className="text-muted-foreground text-sm">Estado de la suscripción</span>
            <div>
              <Badge
                variant="outline"
                className={
                  estadoActivo
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400"
                }
              >
                {vendor.estado || "—"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Datos editables */}
      <Card>
        <CardHeader>
          <CardTitle>Datos de contacto y negocio</CardTitle>
          <CardDescription>Podés corregir estos datos cuando quieras.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {CAMPOS.map((c) => (
            <div key={c.key} className={`grid gap-1.5 ${c.ancho === "full" ? "sm:col-span-2" : ""}`}>
              <Label htmlFor={c.key}>{c.label}</Label>
              <Input
                id={c.key}
                value={form[c.key] ?? ""}
                placeholder={c.placeholder}
                onChange={(e) => set(c.key, e.target.value)}
              />
            </div>
          ))}

          {/* Marcas — selección múltiple del catálogo, colapsable para no cansar la vista */}
          <div className="grid gap-2 sm:col-span-2">
            <Label>Marcas que ofreces</Label>
            <Collapsible open={marcasOpen} onOpenChange={setMarcasOpen}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="hover:bg-accent flex w-full cursor-pointer items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm"
                >
                  <span className="text-muted-foreground truncate">
                    {marcasSel.size === 0
                      ? "Ninguna marca seleccionada"
                      : `${marcasSel.size} seleccionada${marcasSel.size === 1 ? "" : "s"} — ${MARCAS.filter((m) => marcasSel.has(m)).join(", ")}`}
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 transition-transform", marcasOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 grid max-h-56 grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-3">
                  {MARCAS.map((marca) => (
                    <label key={marca} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={marcasSel.has(marca)}
                        onCheckedChange={(v) => toggleMarca(marca, v === true)}
                        className="cursor-pointer"
                      />
                      <span>{marca}</span>
                    </label>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex items-center gap-3 sm:col-span-2">
            <Button onClick={guardar} disabled={!hayCambios || pending} className="cursor-pointer">
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
            {hayCambios && !pending && (
              <span className="text-muted-foreground text-sm">
                {cambios.length} campo{cambios.length > 1 ? "s" : ""} sin guardar
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Protección de datos — solo un texto al final */}
      <p className="text-muted-foreground px-1 text-xs">
        Bajo la Ley 21.719 podés{" "}
        <a href={mailtoEliminar} className="underline underline-offset-2 hover:text-foreground">
          solicitar la eliminación de tus datos
        </a>
        .
      </p>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}
