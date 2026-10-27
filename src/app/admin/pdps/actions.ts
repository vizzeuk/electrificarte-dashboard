"use server";

import { revalidatePath } from "next/cache";
import { getAdminEmail } from "@/lib/auth/admin";
import * as api from "@/lib/pdp-api";
import { esFichaId, FICHA_MAX_BYTES, validarFicha, type PdpDatos, type PdpResultado, type PdpSolicitud } from "@/lib/pdp";

/**
 * Server actions de la sección PDPs. Cada una valida la sesión de admin ANTES de tocar la web:
 * sin sesión (o con un correo fuera de ADMIN_EMAILS) responden "No autorizado" y no llaman a nada.
 * El secreto vive solo en `lib/pdp-api.ts`.
 */

const NO_AUTORIZADO: PdpResultado<never> = { ok: false, tipo: "no_autorizado", errores: ["No autorizado."] };

const texto = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Revisión mínima en el servidor (la validación de verdad la hace la web). */
function limpiar(d: Partial<PdpDatos>, parcial: boolean): { datos: Partial<PdpDatos>; errores: string[] } {
  const errores: string[] = [];
  const datos: Partial<PdpDatos> = {};
  const req = (campo: keyof PdpDatos) => !parcial || campo in d;

  if (req("marca")) { datos.marca = texto(d.marca, 80); if (!datos.marca) errores.push("Falta la marca."); }
  if (req("modelo")) { datos.modelo = texto(d.modelo, 120); if (!datos.modelo) errores.push("Falta el modelo."); }
  if (req("tipo")) { datos.tipo = texto(d.tipo, 80); if (!datos.tipo) errores.push("Falta el tipo."); }
  if (req("electrificacion")) { datos.electrificacion = texto(d.electrificacion, 20); if (!datos.electrificacion) errores.push("Falta la electrificación."); }
  // Año, URL y versiones son opcionales (oct-2026): vacíos van como null / null / [].
  if (req("anio")) {
    const vacio = d.anio == null || String(d.anio).trim() === "";
    datos.anio = vacio ? null : Number(d.anio);
    if (!vacio && !Number.isInteger(datos.anio)) errores.push("El año tiene que ser un número entero.");
  }
  if (req("url_oficial")) {
    datos.url_oficial = texto(d.url_oficial, 2000) || null;
    if (datos.url_oficial) {
      let okUrl = false;
      try { okUrl = new URL(datos.url_oficial).protocol === "https:"; } catch {}
      if (!okUrl) errores.push("La URL oficial tiene que empezar con https://.");
    }
  }
  if (req("versiones")) {
    const vs = Array.isArray(d.versiones) ? d.versiones : [];
    let fichaMala = false;
    let financiamientoMalo = false;
    datos.versiones = vs.slice(0, 40).map((v) => {
      // Tipo/electrificación por versión: opcionales; si van vacíos, la clave no se manda.
      const tipo = texto(v?.tipo, 80);
      const electrificacion = texto(v?.electrificacion, 20);
      // Ficha de la versión: opcional. Sin ella la clave no va (en Corregir, eso la quita).
      const fichaId = v?.ficha_file_id;
      if (fichaId != null && fichaId !== "" && !esFichaId(fichaId)) fichaMala = true;
      const pf = v?.precio_financiamiento == null || String(v.precio_financiamiento) === "" ? null : Number(v.precio_financiamiento);
      if (pf != null && (!Number.isInteger(pf) || pf <= 0 || pf >= Number(v?.precio))) financiamientoMalo = true;
      return {
        nombre: texto(v?.nombre, 120),
        precio: Number(v?.precio),
        ...(pf != null && pf > 0 ? { precio_financiamiento: pf } : {}),
        ...(tipo ? { tipo } : {}),
        ...(electrificacion ? { electrificacion } : {}),
        ...(esFichaId(fichaId) ? { ficha_file_id: fichaId, ficha_nombre: texto(v?.ficha_nombre, 120) || "ficha-tecnica.pdf" } : {}),
      };
    });
    if (fichaMala) errores.push("La ficha técnica de una versión no se subió bien: vuelve a adjuntarla.");
    if (financiamientoMalo) errores.push("El precio con bonos y/o financiamiento de una versión tiene que ser menor que su precio de lista.");
    if (datos.versiones.some((v) => !v.nombre)) errores.push("Cada versión necesita un nombre.");
    if (datos.versiones.some((v) => !Number.isInteger(v.precio) || v.precio <= 0)) errores.push("Cada versión necesita un precio en pesos mayor a 0.");
  }
  // Ficha técnica: siempre opcional. El id lo devuelve `subirFichaPdp`; null = quitarla.
  if ("ficha_file_id" in d) {
    const id = d.ficha_file_id;
    if (id === null) {
      datos.ficha_file_id = null;
      datos.ficha_nombre = null;
    } else if (esFichaId(id)) {
      datos.ficha_file_id = id;
      datos.ficha_nombre = texto(d.ficha_nombre, 120) || "ficha-tecnica.pdf";
    } else {
      errores.push("La ficha técnica no se subió bien: vuelve a adjuntarla.");
    }
  }
  return { datos, errores };
}

export async function crearPdp(input: PdpDatos): Promise<PdpResultado<api.Creada>> {
  const admin = await getAdminEmail();
  if (!admin) return NO_AUTORIZADO;
  const { datos, errores } = limpiar(input, false);
  if (errores.length) return { ok: false, tipo: "errores", errores };
  // `creado_por` lo pone el servidor con el correo de la sesión, nunca el formulario.
  const res = await api.crearSolicitud({ ...(datos as PdpDatos), creado_por: admin });
  if (res.ok) revalidatePath("/admin/pdps");
  return res;
}

/** Sube la ficha técnica (PDF) antes de crear o corregir. Devuelve el id que va en la solicitud. */
export async function subirFichaPdp(form: FormData): Promise<PdpResultado<api.FichaSubida>> {
  const admin = await getAdminEmail();
  if (!admin) return NO_AUTORIZADO;
  const archivo = form.get("ficha");
  if (!(archivo instanceof File)) return { ok: false, tipo: "errores", errores: ["Falta el archivo de la ficha técnica."] };
  if (archivo.size > FICHA_MAX_BYTES) return { ok: false, tipo: "errores", errores: [validarFicha(archivo.size, new Uint8Array())!] };
  const bytes = await archivo.arrayBuffer();
  const error = validarFicha(bytes.byteLength, new Uint8Array(bytes, 0, Math.min(5, bytes.byteLength)));
  if (error) return { ok: false, tipo: "errores", errores: [`Ficha técnica: ${error}`] };
  return api.subirFicha(bytes, archivo.name || "ficha-tecnica.pdf");
}

export async function listarPdps(): Promise<PdpResultado<PdpSolicitud[]>> {
  const admin = await getAdminEmail();
  if (!admin) return NO_AUTORIZADO;
  return api.listarSolicitudes({ limit: 100 });
}

export async function reintentarPdp(id: string, cambios?: Partial<PdpDatos>): Promise<PdpResultado<api.Reintentada>> {
  const admin = await getAdminEmail();
  if (!admin) return NO_AUTORIZADO;
  if (typeof id !== "string" || !id) return { ok: false, tipo: "errores", errores: ["Falta el id."] };
  let limpios: Partial<PdpDatos> | undefined;
  if (cambios && Object.keys(cambios).length) {
    const { datos, errores } = limpiar(cambios, true);
    if (errores.length) return { ok: false, tipo: "errores", errores };
    limpios = datos;
  }
  const res = await api.reintentarSolicitud(id, limpios);
  if (res.ok) revalidatePath("/admin/pdps");
  return res;
}

export async function cancelarPdp(id: string): Promise<PdpResultado<PdpSolicitud | null>> {
  const admin = await getAdminEmail();
  if (!admin) return NO_AUTORIZADO;
  if (typeof id !== "string" || !id) return { ok: false, tipo: "errores", errores: ["Falta el id."] };
  const res = await api.cancelarSolicitud(id);
  if (res.ok) revalidatePath("/admin/pdps");
  return res;
}
