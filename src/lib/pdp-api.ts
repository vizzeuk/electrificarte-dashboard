import "server-only";
import type { PdpDatos, PdpOpciones, PdpResultado, PdpSolicitud } from "@/lib/pdp";

/**
 * Cliente de `/api/admin/pdp/*` de la web. SOLO SERVIDOR: lleva el secreto de admin.
 * Lo importan las server actions de `app/admin/pdps/actions.ts` y las páginas de esa sección.
 *
 * - Variables: `ELECTRIFICARTE_API_BASE` (default producción, con www) y `ADMIN_API_SECRET`
 *   (el de Vercel, el mismo que usa `/api/reviews/publish`). Nada de NEXT_PUBLIC.
 * - Nunca se reenvían al browser los headers ni el cuerpo crudo de la web: cada función
 *   devuelve un `PdpResultado` ya traducido.
 * - `redirect: "manual"`: un 3xx con el secreto adentro no se sigue; se informa como error de
 *   configuración (p. ej. la base sin www responde 308).
 */

const BASE = (process.env.ELECTRIFICARTE_API_BASE ?? "https://www.electrificarte.com").replace(/\/+$/, "");
const TIMEOUT_CREAR = 25_000;
const TIMEOUT = 10_000;
const CACHE_OPCIONES_MS = 5 * 60_000;

const MSG_CONFIG =
  "El panel no pudo autenticarse con la web (ADMIN_API_SECRET o ELECTRIFICARTE_API_BASE mal configurados). No es un error de los datos: avisa a quien administra el panel.";
const MSG_FALLO = "No se pudo crear, intenta de nuevo.";

type Respuesta = { status: number; body: Record<string, unknown> | null };

async function llamar(
  ruta: string,
  init: { method?: "GET" | "POST"; body?: unknown; timeout?: number } = {},
): Promise<Respuesta | { status: "config" | "red" }> {
  const secreto = process.env.ADMIN_API_SECRET;
  if (!secreto) return { status: "config" };
  try {
    const res = await fetch(`${BASE}${ruta}`, {
      method: init.method ?? "GET",
      headers: {
        "x-admin-secret": secreto,
        accept: "application/json",
        ...(init.body !== undefined ? { "content-type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(init.timeout ?? TIMEOUT),
    });
    if (res.status >= 300 && res.status < 400) return { status: "config" };
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { status: res.status, body };
  } catch {
    return { status: "red" };
  }
}

function errores(body: Record<string, unknown> | null): string[] {
  const e = body?.errores;
  if (Array.isArray(e)) return e.map(String).filter(Boolean);
  if (typeof body?.error === "string") return [body.error];
  return [];
}

/** Traduce lo que no es 2xx a un resultado de error para la UI. */
function fallo(r: Respuesta | { status: "config" | "red" }, msgFallo = MSG_FALLO): PdpResultado<never> {
  if (r.status === "config" || r.status === 401 || r.status === 403) {
    return { ok: false, tipo: "config", errores: [MSG_CONFIG] };
  }
  if (r.status === "red") return { ok: false, tipo: "fallo", errores: [msgFallo] };
  if (r.status === 422 || r.status === 400) {
    const e = errores(r.body);
    return { ok: false, tipo: "errores", errores: e.length ? e : ["Los datos no pasaron la validación."] };
  }
  if (r.status === 409) {
    const e = errores(r.body);
    return { ok: false, tipo: "conflicto", errores: e.length ? e : ["Ya hay una solicitud en curso para este auto."] };
  }
  if (r.status === 404) return { ok: false, tipo: "fallo", errores: ["La solicitud no existe."] };
  return { ok: false, tipo: "fallo", errores: [msgFallo] };
}

// — Opciones de los selects (cache en memoria del proceso) ————————————————————————————

let cacheOpciones: { data: PdpOpciones; at: number } | null = null;

export async function obtenerOpciones(): Promise<PdpResultado<PdpOpciones>> {
  if (cacheOpciones && Date.now() - cacheOpciones.at < CACHE_OPCIONES_MS) {
    return { ok: true, data: cacheOpciones.data };
  }
  const r = await llamar("/api/admin/pdp/opciones");
  if (typeof r.status === "number" && r.status === 200 && "body" in r && r.body) {
    const b = r.body as unknown as PdpOpciones;
    const data: PdpOpciones = {
      marcas: Array.isArray(b.marcas) ? b.marcas : [],
      tipos: Array.isArray(b.tipos) ? b.tipos : [],
      electrificaciones: Array.isArray(b.electrificaciones) ? b.electrificaciones : [],
      anioMin: Number(b.anioMin) || 2015,
      anioMax: Number(b.anioMax) || new Date().getFullYear() + 2,
    };
    cacheOpciones = { data, at: Date.now() };
    return { ok: true, data };
  }
  // Si la web no responde, mejor una copia algo vieja que un formulario vacío.
  if (cacheOpciones) return { ok: true, data: cacheOpciones.data };
  return fallo(r, "No se pudieron cargar las marcas y tipos. Intenta de nuevo.");
}

// — Solicitudes ————————————————————————————————————————————————————————————————————————

export async function listarSolicitudes(opts: { estado?: string; limit?: number } = {}): Promise<PdpResultado<PdpSolicitud[]>> {
  const q = new URLSearchParams({ limit: String(opts.limit ?? 100) });
  if (opts.estado) q.set("estado", opts.estado);
  const r = await llamar(`/api/admin/pdp/solicitudes?${q}`);
  if (r.status === 200 && "body" in r) {
    const lista = r.body?.solicitudes;
    return { ok: true, data: Array.isArray(lista) ? (lista as PdpSolicitud[]) : [] };
  }
  return fallo(r, "No se pudo cargar la lista. Intenta de nuevo.");
}

export async function obtenerSolicitud(id: string): Promise<PdpResultado<PdpSolicitud>> {
  const r = await llamar(`/api/admin/pdp/solicitudes?id=${encodeURIComponent(id)}`);
  if (r.status === 200 && "body" in r && r.body?.solicitud) {
    return { ok: true, data: r.body.solicitud as PdpSolicitud };
  }
  return fallo(r, "No se pudo cargar la solicitud. Intenta de nuevo.");
}

export interface Creada {
  solicitud: PdpSolicitud | null;
  avisos: string[];
  arrancaYa: boolean;
}

/** Tarda 1–15 s: la web revisa que la URL esté viva. */
export async function crearSolicitud(datos: PdpDatos & { creado_por: string }): Promise<PdpResultado<Creada>> {
  const r = await llamar("/api/admin/pdp/solicitudes", { method: "POST", body: datos, timeout: TIMEOUT_CREAR });
  if ((r.status === 201 || r.status === 200) && "body" in r && r.body?.ok !== false) {
    return {
      ok: true,
      data: {
        solicitud: (r.body?.solicitud as PdpSolicitud) ?? null,
        avisos: Array.isArray(r.body?.avisos) ? (r.body!.avisos as unknown[]).map(String) : [],
        arrancaYa: r.body?.arrancaYa !== false,
      },
    };
  }
  return fallo(r);
}

/** Reintento, con o sin `cambios` (solo los campos que cambiaron). */
export async function reintentarSolicitud(id: string, cambios?: Partial<PdpDatos>): Promise<PdpResultado<PdpSolicitud | null>> {
  const body = cambios && Object.keys(cambios).length ? { id, cambios } : { id };
  const r = await llamar("/api/admin/pdp/solicitudes/reintentar", { method: "POST", body, timeout: TIMEOUT_CREAR });
  if (r.status === 200 && "body" in r && r.body?.ok !== false) {
    return { ok: true, data: (r.body?.solicitud as PdpSolicitud) ?? null };
  }
  return fallo(r, "No se pudo reintentar, intenta de nuevo.");
}

/** Solo funciona en `listo`; si el flujo ya la tomó, la web responde 409. */
export async function cancelarSolicitud(id: string): Promise<PdpResultado<PdpSolicitud | null>> {
  const r = await llamar("/api/admin/pdp/solicitudes/cancelar", { method: "POST", body: { id } });
  if (r.status === 200 && "body" in r && r.body?.ok !== false) {
    return { ok: true, data: (r.body?.solicitud as PdpSolicitud) ?? null };
  }
  return fallo(r, "No se pudo cancelar, intenta de nuevo.");
}
