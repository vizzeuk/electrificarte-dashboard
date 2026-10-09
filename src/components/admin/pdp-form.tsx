"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Check, ChevronsUpDown, CircleAlert, ExternalLink, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crearPdp, reintentarPdp } from "@/app/admin/pdps/actions";
import { conPuntos, sinPuntos, type PdpDatos, type PdpOpciones, type PdpResultado, type PdpSolicitud } from "@/lib/pdp";
import { cn, formatCLP } from "@/lib/utils";

type Valores = {
  marca: string;
  modelo: string;
  anio: string;
  tipo: string;
  electrificacion: string;
  url_oficial: string;
  versiones: { nombre: string; precio: string }[];
};

type ErrorServidor = Extract<PdpResultado<unknown>, { ok: false }>;

function aValores(s?: PdpSolicitud): Valores {
  return {
    marca: s?.marca ?? "",
    modelo: s?.modelo ?? "",
    anio: s?.anio ? String(s.anio) : "",
    tipo: s?.tipo ?? "",
    electrificacion: s?.electrificacion ?? "",
    url_oficial: s?.url_oficial ?? "",
    versiones: s?.versiones?.length
      ? s.versiones.map((v) => ({ nombre: v.nombre ?? "", precio: conPuntos(v.precio ?? "") }))
      : [{ nombre: "", precio: "" }],
  };
}

function aDatos(v: Valores): PdpDatos {
  return {
    marca: v.marca,
    modelo: v.modelo.trim(),
    anio: Number(v.anio),
    tipo: v.tipo,
    electrificacion: v.electrificacion,
    url_oficial: v.url_oficial.trim(),
    versiones: v.versiones.map((x) => ({ nombre: x.nombre.trim(), precio: sinPuntos(x.precio) })),
  };
}

/** Solo lo que cambió respecto de la solicitud original (para "Corregir y reintentar"). */
function diferencias(nuevo: PdpDatos, original: PdpDatos): Partial<PdpDatos> {
  const cambios: Partial<PdpDatos> = {};
  for (const k of Object.keys(nuevo) as (keyof PdpDatos)[]) {
    if (JSON.stringify(nuevo[k]) !== JSON.stringify(original[k])) {
      (cambios as Record<string, unknown>)[k] = nuevo[k];
    }
  }
  return cambios;
}

const TITULO_ERROR: Record<ErrorServidor["tipo"], string> = {
  errores: "Revisa estos datos",
  conflicto: "Ya hay una solicitud en curso para este auto",
  config: "Error de configuración del panel",
  fallo: "No se pudo enviar",
  no_autorizado: "Tu sesión no tiene permisos de administración",
};

export function PdpForm({ opciones, solicitud }: { opciones: PdpOpciones; solicitud?: PdpSolicitud }) {
  const router = useRouter();
  const corrigiendo = Boolean(solicitud);
  const original = useRef(aDatos(aValores(solicitud)));
  const alertaRef = useRef<HTMLDivElement>(null);
  const [errorServidor, setErrorServidor] = useState<ErrorServidor | null>(null);
  const [marcaAbierta, setMarcaAbierta] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ defaultValues: aValores(solicitud), mode: "onTouched" });
  const versiones = useFieldArray({ control, name: "versiones" });

  const marca = watch("marca");
  const precios = watch("versiones").map((v) => sinPuntos(v.precio)).filter((n) => n > 0);
  const base = precios.length ? Math.min(...precios) : null;
  const sitio = opciones.marcas.find((m) => m.valor === marca)?.sitio;
  // Si la marca original ya no está en Sanity, igual se muestra para que se vea qué falló.
  const marcas = opciones.marcas.some((m) => m.valor === solicitud?.marca) || !solicitud?.marca
    ? opciones.marcas
    : [{ valor: solicitud.marca, slug: "", sitio: null }, ...opciones.marcas];

  function mostrarError(e: ErrorServidor) {
    setErrorServidor(e);
    requestAnimationFrame(() => {
      alertaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      alertaRef.current?.focus({ preventScroll: true });
    });
  }

  const enviar = handleSubmit(async (valores) => {
    setErrorServidor(null);
    const datos = aDatos(valores);
    try {
      if (solicitud) {
        const cambios = diferencias(datos, original.current);
        const res = await reintentarPdp(solicitud.id, cambios);
        if (!res.ok) return mostrarError(res);
        toast.success(Object.keys(cambios).length ? "Reintento en cola con tus cambios" : "Reintento en cola", {
          description: "Empieza en menos de 15 min.",
        });
      } else {
        const res = await crearPdp(datos);
        if (!res.ok) return mostrarError(res);
        const notas = [...res.data.avisos, ...(res.data.arrancaYa ? [] : ["Empieza en menos de 15 min."])];
        toast.success("Solicitud creada", {
          description: notas.length ? notas.join("\n") : "La investigación ya arrancó.",
          duration: res.data.avisos.length ? 15_000 : 5_000,
        });
      }
      router.push("/admin/pdps");
      router.refresh();
    } catch {
      mostrarError({ ok: false, tipo: "fallo", errores: ["No se pudo crear, intenta de nuevo."] });
    }
  });

  const err = (m?: string) => (m ? <p className="text-destructive text-small">{m}</p> : null);

  return (
    <form onSubmit={enviar} noValidate className="flex max-w-3xl flex-col gap-6">
      {errorServidor && (
        <div
          ref={alertaRef}
          tabIndex={-1}
          role="alert"
          className="border-destructive bg-background flex scroll-mt-24 gap-3 rounded-card border p-5"
        >
          <CircleAlert className="text-destructive mt-0.5 size-5 shrink-0" strokeWidth={1.5} aria-hidden />
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-destructive font-semibold">{TITULO_ERROR[errorServidor.tipo]}</p>
            <ul className="text-foreground flex list-disc flex-col gap-1 pl-5 text-small">
              {errorServidor.errores.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
            {errorServidor.tipo === "conflicto" && (
              <Link href="/admin/pdps" className="text-link text-small font-semibold underline-offset-4 hover:underline">
                Ver PDPs en creación
              </Link>
            )}
            {errorServidor.tipo !== "config" && errorServidor.tipo !== "no_autorizado" && (
              <p className="text-muted-foreground text-small">Lo que escribiste sigue abajo: corrige y vuelve a enviar.</p>
            )}
          </div>
        </div>
      )}

      <fieldset disabled={isSubmitting} className="flex flex-col gap-6">
        {/* El auto */}
        <section className="bg-card flex flex-col gap-5 rounded-card border p-5 sm:p-6">
          <h2 className="font-display text-h4 font-bold">El auto</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pdp-marca">Marca</Label>
              <Controller
                control={control}
                name="marca"
                rules={{ required: "Elige la marca." }}
                render={({ field, fieldState }) => (
                  <Popover open={marcaAbierta} onOpenChange={setMarcaAbierta}>
                    <PopoverTrigger asChild>
                      <Button
                        id="pdp-marca"
                        type="button"
                        variant="outline"
                        role="combobox"
                        aria-expanded={marcaAbierta}
                        aria-invalid={Boolean(fieldState.error)}
                        onBlur={field.onBlur}
                        className={cn(
                          "w-full justify-between px-3.5 text-base font-normal hover:border-ink-3",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        <span className="truncate">{field.value || "Elige una marca"}</span>
                        <ChevronsUpDown className="text-muted-foreground size-4" strokeWidth={1.5} aria-hidden />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64">
                      <Command>
                        <CommandInput placeholder="Buscar marca" />
                        <CommandList>
                          <CommandEmpty>No está. Si falta, créala primero en Studio.</CommandEmpty>
                          <CommandGroup>
                            {marcas.map((m) => (
                              <CommandItem
                                key={m.valor}
                                value={m.valor}
                                onSelect={() => {
                                  field.onChange(m.valor);
                                  setMarcaAbierta(false);
                                }}
                              >
                                <Check className={cn("size-4", field.value === m.valor ? "opacity-100" : "opacity-0")} aria-hidden />
                                {m.valor}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              {err(errors.marca?.message)}
              {!errors.marca && <p className="text-muted-foreground text-small">Si no aparece, hay que crearla primero en Studio.</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="pdp-modelo">Modelo</Label>
              <Input
                id="pdp-modelo"
                placeholder="Ora 5"
                autoComplete="off"
                aria-invalid={Boolean(errors.modelo)}
                {...register("modelo", {
                  required: "Escribe el modelo.",
                  validate: (v) => {
                    const m = watch("marca").trim().toLowerCase();
                    return !m || !v.trim().toLowerCase().startsWith(`${m} `) || "Sin la marca en el modelo.";
                  },
                })}
              />
              {err(errors.modelo?.message)}
              {!errors.modelo && <p className="text-muted-foreground text-small">Sin la marca en el modelo: “Ora 03”, no “GWM Ora 03”.</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="pdp-anio">Año</Label>
              <Input
                id="pdp-anio"
                type="number"
                inputMode="numeric"
                min={opciones.anioMin}
                max={opciones.anioMax}
                step={1}
                placeholder={String(Math.min(new Date().getFullYear(), opciones.anioMax))}
                aria-invalid={Boolean(errors.anio)}
                {...register("anio", {
                  required: "Escribe el año.",
                  validate: (v) => {
                    const n = Number(v);
                    if (!Number.isInteger(n)) return "El año es un número entero.";
                    if (n < opciones.anioMin || n > opciones.anioMax) return `Entre ${opciones.anioMin} y ${opciones.anioMax}.`;
                    return true;
                  },
                })}
              />
              {err(errors.anio?.message)}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="pdp-tipo">Tipo</Label>
              <Controller
                control={control}
                name="tipo"
                rules={{ required: "Elige el tipo." }}
                render={({ field, fieldState }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                    <SelectTrigger id="pdp-tipo" className="w-full" aria-invalid={Boolean(fieldState.error)} onBlur={field.onBlur}>
                      <SelectValue placeholder="Elige un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {opciones.tipos.map((t) => (
                        <SelectItem key={t.valor} value={t.valor}>
                          {t.valor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {err(errors.tipo?.message)}
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="pdp-electrificacion">Electrificación</Label>
              <Controller
                control={control}
                name="electrificacion"
                rules={{ required: "Elige la electrificación." }}
                render={({ field, fieldState }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                    <SelectTrigger id="pdp-electrificacion" className="w-full sm:w-1/2" aria-invalid={Boolean(fieldState.error)} onBlur={field.onBlur}>
                      <SelectValue placeholder="Elige la electrificación" />
                    </SelectTrigger>
                    <SelectContent>
                      {opciones.electrificaciones.map((e) => (
                        <SelectItem key={e.valor} value={e.valor}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {err(errors.electrificacion?.message)}
            </div>
          </div>
        </section>

        {/* Fuente */}
        <section className="bg-card flex flex-col gap-5 rounded-card border p-5 sm:p-6">
          <h2 className="font-display text-h4 font-bold">Fuente oficial</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="pdp-url">URL oficial</Label>
            <Input
              id="pdp-url"
              type="url"
              inputMode="url"
              placeholder="https://"
              autoComplete="off"
              aria-invalid={Boolean(errors.url_oficial)}
              aria-describedby="pdp-url-ayuda"
              {...register("url_oficial", {
                required: "Pega la URL oficial.",
                validate: (v) => {
                  try {
                    return new URL(v.trim()).protocol === "https:" || "Tiene que empezar con https://.";
                  } catch {
                    return "No parece una URL. Tiene que empezar con https://.";
                  }
                },
              })}
            />
            {err(errors.url_oficial?.message)}
            <p id="pdp-url-ayuda" className="text-muted-foreground text-small">
              Página de precios, configurador o ficha de venta del modelo en el sitio chileno de la marca. Nunca una
              noticia, nota de prensa o blog.
            </p>
            {sitio && (
              <p className="text-small">
                <span className="text-muted-foreground">Sitio de {marca}: </span>
                <a href={sitio} target="_blank" rel="noopener noreferrer" className="text-link inline-flex items-center gap-1 font-semibold underline-offset-4 hover:underline">
                  {sitio.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  <ExternalLink className="size-3.5" strokeWidth={1.5} aria-hidden />
                </a>
              </p>
            )}
          </div>
        </section>

        {/* Versiones */}
        <section className="bg-card flex flex-col gap-5 rounded-card border p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-h4 font-bold">Versiones</h2>
            <p className="text-muted-foreground text-small">
              Un modelo es una PDP: las versiones van adentro. El precio lo pones tú, no la IA: la IA solo lo compara con
              la fuente y avisa si no calza.
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {versiones.fields.map((f, i) => {
              const e = errors.versiones?.[i];
              return (
                <li key={f.id} className="grid gap-3 border-b pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_13rem_auto] sm:items-start sm:border-b-0 sm:pb-0">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`pdp-v${i}-nombre`} className={cn(i > 0 && "sm:sr-only")}>
                      Nombre de la versión
                    </Label>
                    <Input
                      id={`pdp-v${i}-nombre`}
                      placeholder="Ora 5 Pro"
                      autoComplete="off"
                      aria-invalid={Boolean(e?.nombre)}
                      {...register(`versiones.${i}.nombre`, { required: "Escribe el nombre." })}
                    />
                    {err(e?.nombre?.message)}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor={`pdp-v${i}-precio`} className={cn(i > 0 && "sm:sr-only")}>
                      Precio de lista
                    </Label>
                    <Controller
                      control={control}
                      name={`versiones.${i}.precio`}
                      rules={{ validate: (v) => sinPuntos(v) > 0 || "Escribe el precio en pesos." }}
                      render={({ field, fieldState }) => (
                        <div className="relative">
                          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2" aria-hidden>
                            $
                          </span>
                          <Input
                            id={`pdp-v${i}-precio`}
                            inputMode="numeric"
                            autoComplete="off"
                            placeholder="24.990.000"
                            className="pl-7 tabular-nums"
                            aria-invalid={Boolean(fieldState.error)}
                            value={field.value}
                            onBlur={field.onBlur}
                            ref={field.ref}
                            onChange={(ev) => field.onChange(conPuntos(ev.target.value))}
                          />
                        </div>
                      )}
                    />
                    {err(e?.precio?.message)}
                  </div>
                  <div className={cn("flex justify-end", i === 0 && "sm:pt-[26px]")}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => versiones.remove(i)}
                      disabled={versiones.fields.length === 1}
                      aria-label={`Quitar la versión ${i + 1}`}
                      className="cursor-pointer sm:size-12 sm:px-0"
                    >
                      <Trash2 strokeWidth={1.5} aria-hidden />
                      <span className="sm:sr-only">Quitar</span>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" size="sm" onClick={() => versiones.append({ nombre: "", precio: "" })} className="cursor-pointer">
              <Plus strokeWidth={1.5} aria-hidden /> Agregar versión
            </Button>
            <p className="text-muted-foreground text-small">
              Precio de lista, no el precio con bonos.
              {base != null && (
                <>
                  {" "}Precio base de la PDP: <span className="text-foreground font-semibold tabular-nums">{formatCLP(base)}</span>, el más bajo.
                </>
              )}
            </p>
          </div>
        </section>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="submit" disabled={isSubmitting} className="cursor-pointer">
          {isSubmitting ? (
            <>
              <LoaderCircle className="animate-spin" strokeWidth={1.5} aria-hidden /> Validando…
            </>
          ) : corrigiendo ? (
            "Reintentar con estos datos"
          ) : (
            "Crear solicitud"
          )}
        </Button>
        <Button asChild variant="outline" className={cn(isSubmitting && "pointer-events-none opacity-50")}>
          <Link href="/admin/pdps" aria-disabled={isSubmitting}>
            Volver a la lista
          </Link>
        </Button>
        <p className="text-muted-foreground text-small sm:ml-2" aria-live="polite">
          {isSubmitting ? "Revisando que la URL responda. Puede tardar hasta 15 s." : "Revisamos que la URL esté viva antes de dejarla en cola."}
        </p>
      </div>
    </form>
  );
}
