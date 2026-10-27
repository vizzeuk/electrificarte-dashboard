"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronsUpDown, CircleAlert, ExternalLink, FileText, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { crearPdp, reintentarPdp, subirFichaPdp } from "@/app/admin/pdps/actions";
import { conPuntos, precioBase, sinPuntos, validarFicha, type PdpDatos, type PdpOpciones, type PdpResultado, type PdpSolicitud } from "@/lib/pdp";
import { cn, formatCLP } from "@/lib/utils";

type Valores = {
  marca: string;
  modelo: string;
  anio: string;
  tipo: string;
  electrificacion: string;
  url_oficial: string;
  /**
   * tipo/electrificacion: IGUAL = "Igual que el modelo" (no se manda). ficha_*: la ficha de la
   * versión ya guardada en la web ("" = sin ficha); un PDF recién elegido vive aparte hasta subirlo.
   */
  versiones: { nombre: string; precio: string; tipo: string; electrificacion: string; ficha_file_id: string; ficha_nombre: string }[];
};

/** Valor del select para "Igual que el modelo" (Radix no acepta "" como valor de un ítem). */
const IGUAL = "__igual__";
const VERSION_VACIA = { nombre: "", precio: "", tipo: IGUAL, electrificacion: IGUAL, ficha_file_id: "", ficha_nombre: "" };

type ErrorServidor = Extract<PdpResultado<unknown>, { ok: false }>;

function aValores(s?: PdpSolicitud): Valores {
  return {
    marca: s?.marca ?? "",
    modelo: s?.modelo ?? "",
    anio: s?.anio ? String(s.anio) : "",
    tipo: s?.tipo ?? "",
    electrificacion: s?.electrificacion ?? "",
    url_oficial: s?.url_oficial ?? "",
    // Sin versiones por defecto: son opcionales.
    versiones: s?.versiones?.length
      ? s.versiones.map((v) => ({
          nombre: v.nombre ?? "",
          precio: conPuntos(v.precio ?? ""),
          tipo: v.tipo || IGUAL,
          electrificacion: v.electrificacion || IGUAL,
          ficha_file_id: v.ficha_file_id ?? "",
          ficha_nombre: v.ficha_nombre ?? "",
        }))
      : [],
  };
}

function aDatos(v: Valores): PdpDatos {
  return {
    marca: v.marca,
    modelo: v.modelo.trim(),
    anio: v.anio.trim() ? Number(v.anio) : null,
    tipo: v.tipo,
    electrificacion: v.electrificacion,
    url_oficial: v.url_oficial.trim() || null,
    // Una fila agregada y dejada en blanco no cuenta como versión.
    versiones: v.versiones
      .filter((x) => x.nombre.trim() || sinPuntos(x.precio) > 0)
      .map((x) => ({
        nombre: x.nombre.trim(),
        precio: sinPuntos(x.precio),
        // "Igual que el modelo" o igual al del modelo → la clave no va (ni "" ni null).
        ...(x.tipo !== IGUAL && x.tipo !== v.tipo ? { tipo: x.tipo } : {}),
        ...(x.electrificacion !== IGUAL && x.electrificacion !== v.electrificacion ? { electrificacion: x.electrificacion } : {}),
        // La ficha de la versión: si se conserva, su id vuelve a ir (en Corregir, sin él se borra).
        ...(x.ficha_file_id ? { ficha_file_id: x.ficha_file_id, ficha_nombre: x.ficha_nombre || "ficha-tecnica.pdf" } : {}),
      })),
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

/**
 * Elegir una ficha técnica (PDF): el archivo elegido o el ya guardado, con "Quitar"; si no hay,
 * el input. Lo usan la ficha del modelo y la de cada versión.
 */
function CampoFicha({
  id,
  archivo,
  guardada,
  error,
  ayudaId,
  onElegir,
  onQuitar,
  onSinFicha,
}: {
  id: string;
  archivo: File | null;
  guardada: string | null;
  error: string | null;
  ayudaId?: string;
  onElegir: (archivo: File | undefined) => void;
  onQuitar: () => void;
  onSinFicha: () => void;
}) {
  return (
    <>
      {archivo || guardada ? (
        <div className="flex items-center justify-between gap-3 rounded-control border py-2 pr-2 pl-3 text-small" data-testid={`${id}-elegida`}>
          <span className="flex min-w-0 items-center gap-2">
            <FileText className="text-muted-foreground size-4 shrink-0" strokeWidth={1.5} aria-hidden />
            <span className="truncate">{archivo ? archivo.name : guardada}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {archivo ? `${(archivo.size / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : "ya adjunta"}
            </span>
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={onQuitar} className="shrink-0 cursor-pointer">
            <X strokeWidth={1.5} aria-hidden /> Quitar
          </Button>
        </div>
      ) : (
        <Input
          id={id}
          type="file"
          accept="application/pdf,.pdf"
          aria-invalid={Boolean(error)}
          aria-describedby={ayudaId}
          onChange={(e) => {
            const elegido = e.target.files?.[0];
            // El input queda vacío: el archivo válido se muestra arriba, el inválido no queda elegido.
            e.target.value = "";
            onElegir(elegido);
          }}
          className="cursor-pointer"
        />
      )}
      {error && (
        <p className="text-destructive text-small">
          {error}{" "}
          <Button type="button" variant="link" size="sm" onClick={onSinFicha} className="cursor-pointer">
            Enviar sin ficha
          </Button>
        </p>
      )}
    </>
  );
}

/** null si el PDF sirve; si no, el error para mostrar junto al campo. */
async function revisarPdf(archivo: File): Promise<string | null> {
  return validarFicha(archivo.size, new Uint8Array(await archivo.slice(0, 5).arrayBuffer()));
}

export function PdpForm({ opciones, solicitud }: { opciones: PdpOpciones; solicitud?: PdpSolicitud }) {
  const router = useRouter();
  const corrigiendo = Boolean(solicitud);
  const original = useRef(aDatos(aValores(solicitud)));
  const alertaRef = useRef<HTMLDivElement>(null);
  const [errorServidor, setErrorServidor] = useState<ErrorServidor | null>(null);
  const [marcaAbierta, setMarcaAbierta] = useState(false);
  // Ficha técnica: un PDF nuevo elegido, o (al corregir) quitar la que ya tenía.
  const [ficha, setFicha] = useState<File | null>(null);
  const [quitarFicha, setQuitarFicha] = useState(false);
  const [errorFicha, setErrorFicha] = useState<string | null>(null);
  const fichaGuardada = quitarFicha ? null : solicitud?.ficha_nombre || null;

  async function elegirFicha(archivo: File | undefined) {
    setErrorFicha(null);
    if (!archivo) return;
    const error = await revisarPdf(archivo);
    if (error) return setErrorFicha(error);
    setFicha(archivo);
  }

  // Ficha de cada versión, por el id de la fila (no por la posición: las filas se pueden quitar).
  const [fichasVersion, setFichasVersion] = useState<Record<string, File>>({});
  const [erroresFichaVersion, setErroresFichaVersion] = useState<Record<string, string>>({});
  const [conCampoFicha, setConCampoFicha] = useState<Set<string>>(new Set());
  const sinClave = <T,>(obj: Record<string, T>, k: string) => {
    const { [k]: _fuera, ...resto } = obj;
    return resto;
  };

  async function elegirFichaVersion(filaId: string, archivo: File | undefined) {
    setErroresFichaVersion((prev) => sinClave(prev, filaId));
    if (!archivo) return;
    const error = await revisarPdf(archivo);
    if (error) return setErroresFichaVersion((prev) => ({ ...prev, [filaId]: error }));
    setFichasVersion((prev) => ({ ...prev, [filaId]: archivo }));
  }

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({ defaultValues: aValores(solicitud), mode: "onTouched" });
  const versiones = useFieldArray({ control, name: "versiones" });

  const marca = watch("marca");
  const electrificacionModelo = watch("electrificacion");
  const filas = watch("versiones");
  const base = precioBase(
    filas.map((v) => ({ precio: sinPuntos(v.precio), electrificacion: v.electrificacion === IGUAL ? null : v.electrificacion })),
    electrificacionModelo,
  );
  // La versión más barata es de otra electrificación: el "desde" no la toma (regla de la web).
  const baseIgnoraUna = base != null && filas.some((v) => sinPuntos(v.precio) > 0 && sinPuntos(v.precio) < base);
  // Fila con la parte "Distinta carrocería o electrificación" abierta (las que ya traen valor, abiertas).
  const [distintas, setDistintas] = useState<Set<string>>(new Set());
  // Si una opción guardada ya no está en Sanity, igual se muestra para que se vea qué falló.
  const conGuardado = <T extends { valor: string }>(lista: T[], guardados: (string | null | undefined)[], extra: (v: string) => T) => [
    ...[...new Set(guardados.filter((g): g is string => Boolean(g) && !lista.some((x) => x.valor === g)))].map(extra),
    ...lista,
  ];
  const tiposVersion = conGuardado(opciones.tipos, solicitud?.versiones?.map((v) => v.tipo) ?? [], (valor) => ({ valor, slug: "" }));
  const electrificacionesVersion = conGuardado(
    opciones.electrificaciones,
    solicitud?.versiones?.map((v) => v.electrificacion) ?? [],
    (valor) => ({ valor, nombre: valor }),
  );
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
    // Un archivo inválido no se manda en silencio: se lleva al usuario al campo.
    const iConError = versiones.fields.findIndex((f) => erroresFichaVersion[f.id]);
    if (errorFicha || iConError >= 0) {
      const campo = document.getElementById(errorFicha ? "pdp-ficha" : `pdp-v${iConError}-ficha`);
      campo?.scrollIntoView({ behavior: "smooth", block: "center" });
      campo?.focus({ preventScroll: true });
      return;
    }
    try {
      // Las fichas se suben primero (aparte, por tamaño); la solicitud lleva solo sus ids.
      const subir = async (archivo: File) => {
        const form = new FormData();
        form.append("ficha", archivo);
        return subirFichaPdp(form);
      };
      const deVersiones = versiones.fields
        .map((f, i) => ({ i, archivo: fichasVersion[f.id] }))
        .filter((x): x is { i: number; archivo: File } => Boolean(x.archivo));
      const [subModelo, ...subVersiones] = await Promise.all([
        ficha ? subir(ficha) : null,
        ...deVersiones.map((x) => subir(x.archivo)),
      ]);
      const fallida = [subModelo, ...subVersiones].find((r) => r && !r.ok);
      if (fallida && !fallida.ok) return mostrarError(fallida);
      const conFichas = {
        ...valores,
        versiones: valores.versiones.map((v, i) => {
          const j = deVersiones.findIndex((x) => x.i === i);
          const sub = j >= 0 ? subVersiones[j] : null;
          return sub?.ok ? { ...v, ficha_file_id: sub.data.file_id, ficha_nombre: sub.data.nombre } : v;
        }),
      };
      const datos = aDatos(conFichas);

      let camposFicha: Partial<PdpDatos> = {};
      if (subModelo?.ok) {
        camposFicha = { ficha_file_id: subModelo.data.file_id, ficha_nombre: subModelo.data.nombre };
      } else if (solicitud?.ficha_file_id && quitarFicha) {
        camposFicha = { ficha_file_id: null };
      }

      if (solicitud) {
        const cambios = { ...diferencias(datos, original.current), ...camposFicha };
        const res = await reintentarPdp(solicitud.id, cambios);
        if (!res.ok) return mostrarError(res);
        toast.success(Object.keys(cambios).length ? "Reintento en cola con tus cambios" : "Reintento en cola", {
          description: [...res.data.avisos, "Empieza en menos de 15 min."].join("\n"),
          duration: res.data.avisos.length ? 15_000 : 5_000,
        });
      } else {
        const res = await crearPdp({ ...datos, ...camposFicha });
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
              <Label htmlFor="pdp-anio">
                Año <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
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
                  validate: (v) => {
                    if (!v.trim()) return true;
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
            <Label htmlFor="pdp-url">
              URL oficial <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="pdp-url"
              type="url"
              inputMode="url"
              placeholder="https://"
              autoComplete="off"
              aria-invalid={Boolean(errors.url_oficial)}
              aria-describedby="pdp-url-ayuda"
              {...register("url_oficial", {
                validate: (v) => {
                  if (!v.trim()) return true;
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
              Si la dejas vacía, el agente busca la ficha del modelo dentro del sitio oficial de la marca. Si la pones, que
              sea la página de precios, configurador o ficha de venta en el sitio chileno de la marca; nunca una noticia,
              nota de prensa o blog.
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="pdp-ficha">
              Ficha técnica oficial para Chile <span className="text-muted-foreground font-normal">(opcional, PDF de hasta 4 MB)</span>
            </Label>
            <CampoFicha
              id="pdp-ficha"
              archivo={ficha}
              guardada={fichaGuardada}
              error={errorFicha}
              ayudaId="pdp-ficha-ayuda"
              onElegir={(a) => void elegirFicha(a)}
              onQuitar={() => (ficha ? setFicha(null) : setQuitarFicha(true))}
              onSinFicha={() => setErrorFicha(null)}
            />
            {quitarFicha && !ficha && solicitud?.ficha_nombre && (
              <p className="text-small">
                Se va a quitar {solicitud.ficha_nombre}.{" "}
                <Button type="button" variant="link" size="sm" onClick={() => setQuitarFicha(false)} className="cursor-pointer">
                  Deshacer
                </Button>
              </p>
            )}
            <p id="pdp-ficha-ayuda" className="text-muted-foreground text-small">
              El PDF de la marca para el mercado chileno, no de otro país. El agente lo usa solo para completar datos técnicos
              que la web no publica: si la web dice otra cosa, manda la web. El precio sale de la ficha solo si no pones
              versiones y la web no publica ninguno. El re-check semanal sigue revisando la URL, no la ficha.
            </p>
          </div>
        </section>

        {/* Versiones */}
        <section className="bg-card flex flex-col gap-5 rounded-card border p-5 sm:p-6">
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-h4 font-bold">
              Versiones <span className="text-muted-foreground text-body font-normal">(opcional)</span>
            </h2>
            <p className="text-muted-foreground text-small">
              Un modelo es una PDP: las versiones van adentro. Si las pones con su precio, ese precio manda y la IA solo
              avisa si la fuente dice otra cosa. Si no pones ninguna, el precio se toma de la fuente oficial (con su cita) y
              lo confirmas en Studio antes de publicar.
            </p>
          </div>

          <ul className="flex flex-col gap-4">
            {versiones.fields.map((f, i) => {
              const e = errors.versiones?.[i];
              const fila = filas[i];
              const conValor = Boolean(fila) && (fila.tipo !== IGUAL || fila.electrificacion !== IGUAL);
              const abierta = conValor || distintas.has(f.id);
              const archivoVersion = fichasVersion[f.id] ?? null;
              const guardadaVersion = fila?.ficha_file_id ? fila.ficha_nombre || "ficha-tecnica.pdf" : null;
              const errorVersion = erroresFichaVersion[f.id] ?? null;
              const conFicha = Boolean(archivoVersion || guardadaVersion || errorVersion) || conCampoFicha.has(f.id);
              return (
                <li key={f.id} className="grid gap-3 border-b pb-4 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_13rem_auto] sm:items-start">
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
                      onClick={() => {
                        versiones.remove(i);
                        setFichasVersion((prev) => sinClave(prev, f.id));
                        setErroresFichaVersion((prev) => sinClave(prev, f.id));
                      }}
                      aria-label={`Quitar la versión ${i + 1}`}
                      className="cursor-pointer sm:size-12 sm:px-0"
                    >
                      <Trash2 strokeWidth={1.5} aria-hidden />
                      <span className="sm:sr-only">Quitar</span>
                    </Button>
                  </div>
                  <div className="flex flex-col gap-3 sm:col-span-3">
                    {!conValor && (
                      <button
                        type="button"
                        // Sin esto, el blur del campo vacío pinta su error, la fila se corre y el clic se pierde.
                        onMouseDown={(e) => e.preventDefault()}
                        aria-expanded={abierta}
                        aria-controls={`pdp-v${i}-distinta`}
                        onClick={() =>
                          setDistintas((prev) => {
                            const next = new Set(prev);
                            if (next.has(f.id)) next.delete(f.id);
                            else next.add(f.id);
                            return next;
                          })
                        }
                        className="text-link inline-flex cursor-pointer items-center gap-1 self-start text-small font-semibold underline-offset-4 hover:underline"
                      >
                        Distinta carrocería o electrificación
                        <ChevronDown className={cn("size-4 transition-transform", abierta && "rotate-180")} strokeWidth={1.5} aria-hidden />
                      </button>
                    )}
                    {abierta && (
                      <div id={`pdp-v${i}-distinta`} className="flex flex-col gap-2">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor={`pdp-v${i}-tipo`}>Carrocería de la versión</Label>
                            <Controller
                              control={control}
                              name={`versiones.${i}.tipo`}
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                                  <SelectTrigger id={`pdp-v${i}-tipo`} className="w-full" onBlur={field.onBlur}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={IGUAL}>Igual que el modelo</SelectItem>
                                    {tiposVersion.map((t) => (
                                      <SelectItem key={t.valor} value={t.valor}>
                                        {t.valor}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor={`pdp-v${i}-electrificacion`}>Electrificación de la versión</Label>
                            <Controller
                              control={control}
                              name={`versiones.${i}.electrificacion`}
                              render={({ field }) => (
                                <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
                                  <SelectTrigger id={`pdp-v${i}-electrificacion`} className="w-full" onBlur={field.onBlur}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={IGUAL}>Igual que el modelo</SelectItem>
                                    {electrificacionesVersion.map((x) => (
                                      <SelectItem key={x.valor} value={x.valor}>
                                        {x.nombre}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                        </div>
                        <p className="text-muted-foreground text-small">
                          Solo si esta versión es de otra tecnología o carrocería que el modelo (ej. la versión eléctrica de un
                          modelo híbrido). El tipo y la electrificación del modelo son los principales.
                        </p>
                      </div>
                    )}
                    {!conFicha ? (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => setConCampoFicha((prev) => new Set(prev).add(f.id))}
                        className="text-link inline-flex cursor-pointer items-center gap-1 self-start text-small font-semibold underline-offset-4 hover:underline"
                      >
                        <Plus className="size-4" strokeWidth={1.5} aria-hidden />
                        Ficha técnica de esta versión
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Label htmlFor={`pdp-v${i}-ficha`}>
                          Ficha técnica de esta versión <span className="text-muted-foreground font-normal">(opcional, PDF de hasta 4 MB)</span>
                        </Label>
                        <CampoFicha
                          id={`pdp-v${i}-ficha`}
                          archivo={archivoVersion}
                          guardada={guardadaVersion}
                          error={errorVersion}
                          ayudaId={`pdp-v${i}-ficha-ayuda`}
                          onElegir={(a) => void elegirFichaVersion(f.id, a)}
                          onQuitar={() => {
                            if (archivoVersion) return setFichasVersion((prev) => sinClave(prev, f.id));
                            setValue(`versiones.${i}.ficha_file_id`, "", { shouldDirty: true });
                            setValue(`versiones.${i}.ficha_nombre`, "", { shouldDirty: true });
                          }}
                          onSinFicha={() => {
                            setErroresFichaVersion((prev) => sinClave(prev, f.id));
                            setConCampoFicha((prev) => {
                              const next = new Set(prev);
                              next.delete(f.id);
                              return next;
                            });
                          }}
                        />
                        <p id={`pdp-v${i}-ficha-ayuda`} className="text-muted-foreground text-small">
                          Solo si esta versión tiene su propio PDF (otra batería, motor o tracción). El agente lo usa para los
                          datos técnicos de esta versión que la web no publica. El precio es el que pusiste arriba.
                        </p>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              // El blur de un nombre vacío pinta su error y corre el botón: sin esto el clic se pierde.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => versiones.append({ ...VERSION_VACIA })}
              className="cursor-pointer"
            >
              <Plus strokeWidth={1.5} aria-hidden /> Agregar versión
            </Button>
            <p className="text-muted-foreground text-small">
              Precio de lista, no el precio con bonos.
              {base != null && (
                <>
                  {" "}Precio base de la PDP: <span className="text-foreground font-semibold tabular-nums">{formatCLP(base)}</span>,
                  {baseIgnoraUna ? " el más bajo de la electrificación del modelo." : " el más bajo."}
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
          {isSubmitting
            ? ficha || Object.keys(fichasVersion).length
              ? "Subiendo las fichas y revisando que la URL responda. Puede tardar hasta 30 s."
              : "Revisando que la URL responda. Puede tardar hasta 15 s."
            : "Revisamos que la URL esté viva antes de dejarla en cola."}
        </p>
      </div>
    </form>
  );
}
