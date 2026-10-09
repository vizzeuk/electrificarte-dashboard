"use server";

import { revalidatePath } from "next/cache";
import { getAdminEmail } from "@/lib/auth/admin";
import * as api from "@/lib/pdp-api";
import type { PdpDatos, PdpResultado, PdpSolicitud } from "@/lib/pdp";

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
  if (req("anio")) {
    datos.anio = Number(d.anio);
    if (!Number.isInteger(datos.anio)) errores.push("El año tiene que ser un número entero.");
  }
  if (req("url_oficial")) {
    datos.url_oficial = texto(d.url_oficial, 2000);
    let okUrl = false;
    try { okUrl = new URL(datos.url_oficial).protocol === "https:"; } catch {}
    if (!okUrl) errores.push("La URL oficial tiene que empezar con https://.");
  }
  if (req("versiones")) {
    const vs = Array.isArray(d.versiones) ? d.versiones : [];
    datos.versiones = vs.slice(0, 40).map((v) => ({ nombre: texto(v?.nombre, 120), precio: Number(v?.precio) }));
    if (datos.versiones.length === 0) errores.push("Agrega al menos una versión.");
    if (datos.versiones.some((v) => !v.nombre)) errores.push("Cada versión necesita un nombre.");
    if (datos.versiones.some((v) => !Number.isInteger(v.precio) || v.precio <= 0)) errores.push("Cada versión necesita un precio en pesos mayor a 0.");
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

export async function listarPdps(): Promise<PdpResultado<PdpSolicitud[]>> {
  const admin = await getAdminEmail();
  if (!admin) return NO_AUTORIZADO;
  return api.listarSolicitudes({ limit: 100 });
}

export async function reintentarPdp(id: string, cambios?: Partial<PdpDatos>): Promise<PdpResultado<PdpSolicitud | null>> {
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
