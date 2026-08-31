import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PREVIEW_MODE, previewVendor } from "@/lib/mock/preview";

export interface VendorRow {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  telefono: string | null;
  nombre_concesionario: string | null;
  comuna: string | null;
  region: string | null;
  marcas: string | null;
  estado: string | null;
  rut_vendors: string | null;
  user_id: string | null;
}

/**
 * Estados de leads_vendors que cuentan como "suscripción activa".
 * PENDIENTE confirmar los valores reales (hoy el dato es 'nuevo'). Configurable
 * por env ACTIVE_VENDOR_ESTADOS (coma-separado). Vacío = permitir cualquiera
 * (modo dev, mientras se define la regla de negocio).
 */
export function activeVendorEstados(): string[] {
  return (process.env.ACTIVE_VENDOR_ESTADOS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isActiveVendor(vendor: VendorRow | null): boolean {
  if (!vendor) return false;
  const allowed = activeVendorEstados();
  if (allowed.length === 0) return true; // dev: sin gating hasta confirmar valores
  return allowed.includes((vendor.estado ?? "").toLowerCase());
}

const VENDOR_COLUMNS =
  "id, nombre, apellido, email, telefono, nombre_concesionario, comuna, region, marcas, estado, rut_vendors, user_id";

/**
 * Estado de sesión del panel vendedor:
 *  - "anon"          → no hay sesión (redirigir a /login).
 *  - "no_registrado" → hay sesión pero ese email no está en leads_vendors.
 *  - "ok"            → hay sesión y vendedor vinculado (activo o no).
 */
export type VendorSession =
  | { status: "anon"; vendor: null }
  | { status: "no_registrado"; vendor: null; email: string }
  | { status: "ok"; vendor: VendorRow };

export async function getVendorSession(): Promise<VendorSession> {
  if (PREVIEW_MODE) return { status: "ok", vendor: previewVendor }; // PREVIEW_MODE
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anon", vendor: null };

  const { data } = await supabase
    .from("leads_vendors")
    .select(VENDOR_COLUMNS)
    .maybeSingle();

  if (!data) {
    return { status: "no_registrado", vendor: null, email: user.email ?? "" };
  }
  return { status: "ok", vendor: data as VendorRow };
}

/**
 * Fila de leads_vendors del usuario logueado (por RLS, solo devuelve la suya).
 * Devuelve null si no hay sesión o no existe vendedor vinculado a ese email.
 */
export async function getCurrentVendor(): Promise<VendorRow | null> {
  const session = await getVendorSession();
  return session.status === "ok" ? session.vendor : null;
}
