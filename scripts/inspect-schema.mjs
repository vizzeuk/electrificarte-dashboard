// Verificación de esquema en vivo. Uso: node --env-file=.env.local scripts/inspect-schema.mjs
// Solo server-side: usa SERVICE_ROLE_KEY. No commitear salida con datos.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SERVICE) {
  console.error("Faltan envs. Corré con: node --env-file=.env.local scripts/inspect-schema.mjs");
  process.exit(1);
}

const TABLES = ["leads", "leads_vendors", "ofertas", "leads_pool", "stock_maestro"];

// 1) OpenAPI spec de PostgREST → columnas + tipos de todas las tablas del schema public
async function openapi() {
  const res = await fetch(`${URL}/rest/v1/`, {
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
  });
  if (!res.ok) {
    console.error("OpenAPI fetch falló:", res.status, await res.text());
    return {};
  }
  const spec = await res.json();
  return spec.definitions || {};
}

// 2) count con una key dada (service vs anon) → infiere estado RLS
async function count(table, key) {
  const res = await fetch(`${URL}/rest/v1/${table}?select=*&limit=1`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
      Range: "0-0",
    },
  });
  const cr = res.headers.get("content-range"); // "0-0/NN" o "*/NN"
  const total = cr ? cr.split("/")[1] : "?";
  return { status: res.status, total, ok: res.ok };
}

const defs = await openapi();

for (const t of TABLES) {
  console.log(`\n========== ${t} ==========`);
  const def = defs[t];
  if (!def) {
    console.log("  (no está en el schema public / no expuesta por PostgREST)");
  } else {
    const props = def.properties || {};
    for (const [col, meta] of Object.entries(props)) {
      const pk = /Primary Key/i.test(meta.description || "") ? " [PK]" : "";
      const fk = (meta.description || "").match(/foreign key to ([^`]+)/i);
      console.log(`  - ${col}: ${meta.format || meta.type}${pk}${fk ? "  → " + fk[1] : ""}`);
    }
  }
  const svc = await count(t, SERVICE);
  const anon = await count(t, ANON);
  console.log(`  RLS check → service_role: status ${svc.status}, total ${svc.total} | anon: status ${anon.status}, total ${anon.total}`);
  if (svc.ok && anon.ok && anon.total !== "?" && svc.total !== "?") {
    if (Number(anon.total) === 0 && Number(svc.total) > 0) console.log("    → RLS probablemente ON sin política para anon (anon ve 0).");
    else if (Number(anon.total) === Number(svc.total)) console.log("    → ⚠️ anon ve TODO (RLS OFF o política permisiva). Revisar.");
  } else if (!anon.ok) {
    console.log(`    → anon bloqueado (${anon.status}) — RLS ON sin política para anon.`);
  }
}
