#!/usr/bin/env node
// Mock local de /api/admin/pdp/* de electrificarteweb (contrato "Crear PDPs desde el panel").
// Sirve para probar la sección PDPs del panel sin la web real. Todo en memoria: al reiniciar,
// vuelve a la semilla.
//
// Uso:
//   node scripts/mock-pdp-api.mjs                         # puerto 3401, secreto "mock-secreto-pdp"
//   MOCK_SECRET=otro MOCK_PORT=3401 node scripts/mock-pdp-api.mjs
//   MOCK_VACIO=1 node scripts/mock-pdp-api.mjs            # sin solicitudes de ejemplo
//   MOCK_PASO_MS=5000 node scripts/mock-pdp-api.mjs       # estados avanzan más rápido (default 20 s)
//
// Y el panel apuntando al mock (en tu shell, sin tocar .env.local):
//   ELECTRIFICARTE_API_BASE=http://localhost:3401 ADMIN_API_SECRET=mock-secreto-pdp npx next dev --webpack -p 3200
//
// Comportamiento (fiel al contrato, con algunos gatillos para forzar casos):
// - Todo exige `x-admin-secret` igual a MOCK_SECRET; si no, 401.
// - GET  /api/admin/pdp/opciones          → 10 marcas reales + "Zzz" (aparece en el select pero
//                                            el POST la rechaza: sirve para probar el 422).
// - POST /api/admin/pdp/solicitudes       → 422 si la marca no existe o es "Zzz", la URL no es
//                                            https, la URL contiene "404", o faltan campos;
//                                            409 si hay una activa (listo/en cola/procesando) de
//                                            la misma marca+modelo+año; 201 si no. Tarda ~1,2 s
//                                            (4 s si el modelo contiene "lento"). Avisos: si la
//                                            URL contiene "redirige". arrancaYa=false si ya hay
//                                            una en "procesando".
// - GET  /api/admin/pdp/solicitudes       → ?limit, ?estado, ?id. Los estados avanzan solos con
//                                            el tiempo: listo → en cola (1 paso) → procesando (2)
//                                            → terminal (3,5 pasos). El terminal sale del modelo
//                                            o la URL: "error" → error; URL con "noticia"/"blog"
//                                            o modelo con "sin datos" → sin_datos; si no,
//                                            alterna listo_para_revisar / borrador_incompleto.
// - POST /api/admin/pdp/solicitudes/reintentar {id, cambios?} → 200 en sin_datos/error o
//                                            en cola/procesando con más de 30 min; si no, 409.
// - POST /api/admin/pdp/solicitudes/cancelar {id} → 200 solo en "listo" (queda "cancelada");
//                                            si no, 409.
// - GET  /__stats (sin secreto)           → cuántas veces se llamó cada ruta (para los tests).
// - POST /__reset (sin secreto)           → vuelve a la semilla y pone los contadores en 0.

import http from "node:http";
import { randomUUID } from "node:crypto";

const PORT = Number(process.env.MOCK_PORT ?? 3401);
const SECRET = process.env.MOCK_SECRET ?? "mock-secreto-pdp";
const PASO = Number(process.env.MOCK_PASO_MS ?? 20_000);
const MIN = 60_000;

const MARCAS = [
  ["BYD", "byd", "https://www.byd.cl"],
  ["GWM", "gwm", "https://www.gwm.cl"],
  ["Kia", "kia", "https://www.kia.cl"],
  ["Hyundai", "hyundai", "https://www.hyundai.cl"],
  ["MG", "mg", "https://www.mgmotor.cl"],
  ["Chery", "chery", "https://www.chery.cl"],
  ["Tesla", "tesla", "https://www.tesla.com/es_cl"],
  ["Volvo", "volvo", "https://www.volvocars.com/cl"],
  ["Peugeot", "peugeot", null],
  ["Toyota", "toyota", "https://www.toyota.cl"],
  ["Zzz", "zzz", null],
].map(([valor, slug, sitio]) => ({ valor, slug, ...(sitio ? { sitio } : {}) }));

const OPCIONES = {
  marcas: MARCAS,
  tipos: ["SUV", "Sedán", "Hatchback", "Pickup", "Van"].map((valor) => ({ valor, slug: valor.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") })),
  electrificaciones: [
    { valor: "EV", nombre: "100% Eléctrico" },
    { valor: "PHEV", nombre: "Híbrido enchufable" },
    { valor: "HEV", nombre: "Híbrido" },
    { valor: "MHEV", nombre: "Híbrido suave" },
    { valor: "REEV", nombre: "Eléctrico de autonomía extendida" },
  ],
  anioMin: 2015,
  anioMax: 2028,
};

const ACTIVOS = ["listo", "en cola", "procesando"];
let db = [];
let stats = {};
let alterna = 0;

const iso = (t) => new Date(t).toISOString();
const studio = (id) => `https://www.electrificarte.com/studio/structure/auto;${id}`;

function terminal(s) {
  const m = s.modelo.toLowerCase();
  if (m.includes("error")) return "error";
  if (m.includes("sin datos") || /noticia|blog|prensa/.test(s.url_oficial)) return "sin_datos";
  return alterna++ % 2 === 0 ? "listo_para_revisar" : "borrador_incompleto";
}

function cerrar(s, estado, at) {
  const nombre = `${s.marca} ${s.modelo} ${s.anio}`;
  const base = Math.min(...s.versiones.map((v) => v.precio));
  const precio = `$${base.toLocaleString("es-CL")}`;
  s.estado = estado;
  s.terminada_at = iso(at);
  s.updated_at = iso(at);
  s.costo_usd = estado === "error" ? 0.08 : estado === "sin_datos" ? 0.12 : 0.31;
  if (estado === "listo_para_revisar") {
    s.detalle = "Borrador completo y oculto. Falta que una persona lo revise y lo publique.";
    s.studio_url = studio(s.id);
    s.lote = "martes 15:00";
    s.mensaje = `✅ PDP lista para revisar: ${nombre}\n\nVersiones: ${s.versiones.map((v) => v.nombre).join(", ")}\nPrecio base: ${precio} (calza con la fuente)\nAutonomía WLTP: 420 km\nBatería: 60,5 kWh\n\nEl borrador está OCULTO. Revísalo y publícalo en Studio:\n${s.studio_url}\n\nRe-check semanal de precios: martes 15:00.`;
  } else if (estado === "borrador_incompleto") {
    s.detalle = "Faltan: autonomía WLTP y capacidad de batería (la fuente no las publica).";
    s.studio_url = studio(s.id);
    s.lote = "jueves 15:00";
    s.mensaje = `⚠️ Borrador con faltantes: ${nombre}\n\nSe creó el borrador OCULTO, pero la fuente no trae:\n- Autonomía WLTP\n- Capacidad de batería\n\nPrecio base: ${precio}. La versión "${s.versiones[0].nombre}" aparece en la fuente con $200.000 de diferencia: revísalo.\n\nCompleta lo que falta en Studio:\n${s.studio_url}`;
  } else if (estado === "sin_datos") {
    s.detalle = "La URL no tiene precios ni ficha del modelo. Casi siempre es la URL: usa la página de precios o el configurador.";
    s.mensaje = `❌ No se encontraron datos para ${nombre}.\n\nLa página ${s.url_oficial} no tiene precios ni especificaciones del modelo. Parece una noticia o una página general.\n\nCorrige la URL desde el panel y reintenta.`;
  } else {
    s.detalle = "El agente no respondió a tiempo (timeout de 10 min).";
    s.mensaje = `❌ Error al investigar ${nombre}.\n\nEl agente no respondió a tiempo. No se creó nada en Sanity. Puedes reintentar desde el panel.`;
  }
}

/** Avanza el estado según el tiempo desde que quedó en "listo". */
function avanzar(s, now = Date.now()) {
  if (!ACTIVOS.includes(s.estado) || s._pegada) return;
  const dt = now - s._t0;
  if (dt >= PASO * 3.5) {
    cerrar(s, s._final ?? (s._final = terminal(s)), s._t0 + PASO * 3.5);
  } else if (dt >= PASO * 2) {
    if (s.estado !== "procesando") { s.estado = "procesando"; s.detalle = "El agente está leyendo la ficha oficial y armando el borrador."; s.updated_at = iso(s._t0 + PASO * 2); }
  } else if (dt >= PASO) {
    if (s.estado !== "en cola") { s.estado = "en cola"; s.detalle = "n8n la tomó; espera turno del agente."; s.updated_at = iso(s._t0 + PASO); }
  }
}

function nueva(d, extra = {}) {
  const now = Date.now();
  return {
    id: randomUUID(),
    marca: d.marca,
    modelo: d.modelo,
    anio: d.anio,
    tipo: d.tipo,
    electrificacion: d.electrificacion,
    url_oficial: d.url_oficial,
    versiones: d.versiones,
    estado: "listo",
    detalle: "En espera de que n8n la tome.",
    mensaje: null,
    studio_url: null,
    lote: null,
    costo_usd: null,
    creado_por: d.creado_por ?? null,
    created_at: iso(now),
    updated_at: iso(now),
    terminada_at: null,
    intentos: 1,
    _t0: now,
    ...extra,
  };
}

function semilla() {
  alterna = 0;
  db = [];
  if (process.env.MOCK_VACIO) return;
  const now = Date.now();
  const ej = (d, estado, haceMin, extra = {}) => {
    const s = nueva({ creado_por: "francisco@electrificarte.com", tipo: "SUV", electrificacion: "EV", ...d }, { _t0: now - haceMin * MIN, created_at: iso(now - haceMin * MIN), updated_at: iso(now - haceMin * MIN), ...extra });
    if (!ACTIVOS.includes(estado)) cerrar(s, estado, now - (haceMin - 4) * MIN);
    else { s.estado = estado; s._pegada = true; s.detalle = "El agente está leyendo la ficha oficial y armando el borrador."; }
    db.push(s);
  };
  ej({ marca: "Kia", modelo: "EV3", anio: 2026, url_oficial: "https://www.kia.cl/modelos/ev3/", versiones: [{ nombre: "EV3 Light", precio: 29990000 }, { nombre: "EV3 GT-Line", precio: 34990000 }] }, "listo_para_revisar", 180);
  ej({ marca: "BYD", modelo: "Sealion 7", anio: 2026, url_oficial: "https://www.byd.cl/sealion-7/", versiones: [{ nombre: "Sealion 7 Comfort", precio: 39990000 }] }, "borrador_incompleto", 600, { creado_por: "matias@electrificarte.com", intentos: 2 });
  ej({ marca: "MG", modelo: "S5 EV", anio: 2025, url_oficial: "https://www.mgmotor.cl/noticias/lanzamiento-s5", versiones: [{ nombre: "S5 EV Comfort", precio: 24990000 }] }, "sin_datos", 1500);
  ej({ marca: "Chery", modelo: "Tiggo 7 PHEV", anio: 2026, electrificacion: "PHEV", url_oficial: "https://www.chery.cl/tiggo-7-phev", versiones: [{ nombre: "Tiggo 7 PHEV GLX", precio: 26990000 }] }, "error", 3000);
  ej({ marca: "Volvo", modelo: "EX30", anio: 2026, url_oficial: "https://www.volvocars.com/cl/cars/ex30/", versiones: [{ nombre: "EX30 Core", precio: 32990000 }] }, "rechazada", 4500, { creado_por: "matias@electrificarte.com" });
  db[db.length - 1].detalle = "Alguien creó la PDP a mano en Studio mientras tanto: no se duplicó.";
  db[db.length - 1].mensaje = null;
  db[db.length - 1].studio_url = null;
  // Una "pegada": procesando hace 45 min, no avanza sola → permite probar Reintentar.
  ej({ marca: "Hyundai", modelo: "Inster", anio: 2026, tipo: "Hatchback", url_oficial: "https://www.hyundai.cl/inster/", versiones: [{ nombre: "Inster Plus", precio: 21990000 }] }, "procesando", 45);
  db.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function validar(d, parcial = false) {
  const errores = [];
  const has = (k) => !parcial || k in d;
  if (has("marca")) {
    if (!d.marca) errores.push("Falta la marca.");
    else if (d.marca === "Zzz" || !MARCAS.some((m) => m.valor === d.marca)) errores.push(`La marca ${d.marca} no existe en Sanity. Créala primero en Studio.`);
  }
  if (has("modelo") && !String(d.modelo ?? "").trim()) errores.push("Falta el modelo.");
  if (has("anio") && (!Number.isInteger(d.anio) || d.anio < OPCIONES.anioMin || d.anio > OPCIONES.anioMax)) errores.push(`El año tiene que estar entre ${OPCIONES.anioMin} y ${OPCIONES.anioMax}.`);
  if (has("tipo") && !OPCIONES.tipos.some((t) => t.valor === d.tipo)) errores.push(`El tipo "${d.tipo ?? ""}" no existe en Sanity.`);
  if (has("electrificacion") && !OPCIONES.electrificaciones.some((e) => e.valor === d.electrificacion)) errores.push(`La electrificación "${d.electrificacion ?? ""}" no es válida.`);
  if (has("url_oficial")) {
    const u = String(d.url_oficial ?? "");
    if (!u.startsWith("https://")) errores.push("La URL oficial tiene que empezar con https://.");
    else if (u.includes("404")) errores.push("La URL responde 404. Revisa que sea la página del modelo.");
  }
  if (has("versiones")) {
    if (!Array.isArray(d.versiones) || d.versiones.length === 0) errores.push("Falta al menos una versión.");
    else if (d.versiones.some((v) => !v?.nombre || !Number.isInteger(v?.precio) || v.precio <= 0)) errores.push("Cada versión necesita nombre y precio en pesos mayor a 0.");
  }
  if (has("modelo") && /^ya existe/i.test(String(d.modelo ?? ""))) errores.push(`Ya existe una PDP con el slug "${String(d.modelo).toLowerCase().replace(/\W+/g, "-")}".`);
  return errores;
}

const publica = (s) => Object.fromEntries(Object.entries(s).filter(([k]) => !k.startsWith("_")));
const clave = (s) => `${s.marca}|${String(s.modelo).trim().toLowerCase()}|${s.anio}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function leer(req) {
  let raw = "";
  for await (const c of req) raw += c;
  try { return JSON.parse(raw || "{}"); } catch { return null; }
}

semilla();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const ruta = `${req.method} ${url.pathname}`;
  stats[ruta] = (stats[ruta] ?? 0) + 1;
  const log = (status) => console.log(`${new Date().toISOString().slice(11, 19)} ${ruta}${url.search} → ${status}`);

  if (ruta === "GET /__stats") return send(res, 200, stats);
  if (ruta === "POST /__reset") { semilla(); stats = {}; return send(res, 200, { ok: true }); }

  if (req.headers["x-admin-secret"] !== SECRET) { log(401); return send(res, 401, { ok: false, error: "No autorizado" }); }

  const now = Date.now();
  db.forEach((s) => avanzar(s, now));

  if (ruta === "GET /api/admin/pdp/opciones") { log(200); return send(res, 200, OPCIONES); }

  if (ruta === "GET /api/admin/pdp/solicitudes") {
    const id = url.searchParams.get("id");
    if (id) {
      const s = db.find((x) => x.id === id);
      log(s ? 200 : 404);
      return s ? send(res, 200, { solicitud: publica(s) }) : send(res, 404, { ok: false, errores: ["No existe esa solicitud."] });
    }
    const estado = url.searchParams.get("estado");
    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
    const lista = db.filter((s) => !estado || s.estado === estado).slice(0, limit).map(publica);
    log(200);
    return send(res, 200, { solicitudes: lista });
  }

  if (ruta === "POST /api/admin/pdp/solicitudes") {
    const d = await leer(req);
    if (!d) { log(400); return send(res, 400, { ok: false, errores: ["JSON inválido."] }); }
    await sleep(String(d.modelo ?? "").toLowerCase().includes("lento") ? 4000 : 1200);
    const errores = validar(d);
    if (errores.length) { log(422); return send(res, 422, { ok: false, errores }); }
    if (db.some((s) => ACTIVOS.includes(s.estado) && clave(s) === clave(d))) {
      log(409);
      return send(res, 409, { ok: false, errores: [`Ya hay una solicitud en curso de ${d.marca} ${d.modelo} ${d.anio}.`] });
    }
    const avisos = String(d.url_oficial).includes("redirige") ? [`La URL redirige a ${d.url_oficial.replace(/\?.*$/, "")}precios/. Se usará esa.`] : [];
    const arrancaYa = !db.some((s) => s.estado === "procesando" && !s._pegada);
    const s = nueva(d);
    db.unshift(s);
    log(201);
    return send(res, 201, { ok: true, solicitud: publica(s), avisos, arrancaYa });
  }

  if (ruta === "POST /api/admin/pdp/solicitudes/reintentar") {
    const d = await leer(req);
    const s = db.find((x) => x.id === d?.id);
    if (!s) { log(404); return send(res, 404, { ok: false, errores: ["No existe esa solicitud."] }); }
    await sleep(800);
    const pegada = ["en cola", "procesando"].includes(s.estado) && now - new Date(s.updated_at).getTime() > 30 * MIN;
    if (!(["sin_datos", "error"].includes(s.estado) || pegada)) {
      log(409);
      return send(res, 409, { ok: false, errores: [`No se puede reintentar una solicitud en estado "${s.estado}".`] });
    }
    const cambios = d.cambios && typeof d.cambios === "object" ? d.cambios : {};
    const errores = validar(cambios, true);
    if (errores.length) { log(422); return send(res, 422, { ok: false, errores }); }
    Object.assign(s, cambios, {
      estado: "listo", detalle: "En espera de que n8n la tome.", mensaje: null, studio_url: null, lote: null,
      terminada_at: null, costo_usd: null, updated_at: iso(now), intentos: (s.intentos ?? 1) + 1, _t0: now, _pegada: false, _final: undefined,
    });
    console.log("  cambios:", JSON.stringify(cambios));
    log(200);
    return send(res, 200, { ok: true, solicitud: publica(s) });
  }

  if (ruta === "POST /api/admin/pdp/solicitudes/cancelar") {
    const d = await leer(req);
    const s = db.find((x) => x.id === d?.id);
    if (!s) { log(404); return send(res, 404, { ok: false, errores: ["No existe esa solicitud."] }); }
    if (s.estado !== "listo") { log(409); return send(res, 409, { ok: false, errores: ["El flujo ya la tomó: no se puede cancelar."] }); }
    Object.assign(s, { estado: "cancelada", detalle: "Cancelada desde el panel.", terminada_at: iso(now), updated_at: iso(now) });
    log(200);
    return send(res, 200, { ok: true, solicitud: publica(s) });
  }

  log(404);
  send(res, 404, { ok: false, error: "Ruta no encontrada en el mock" });
});

server.listen(PORT, () => console.log(`mock PDP en http://localhost:${PORT} (paso ${PASO / 1000} s, ${db.length} solicitudes de ejemplo)`));
