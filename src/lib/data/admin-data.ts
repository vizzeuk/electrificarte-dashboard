import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminEmail } from "@/lib/auth/admin";
import {
  PREVIEW_MODE,
  previewAdminOverview,
  previewAdminLeads,
  previewAdminVendedores,
} from "@/lib/mock/preview";

// El admin ve datos completos (incluida PII), por eso lee con service role.
// SIEMPRE detrás del gating de admin: cada función valida sesión de admin.

export interface AdminLead {
  id: number;
  created_at: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  telefono: string | null;
  target_model: string | null;
  region: string | null;
  comuna: string | null;
  financing: string | null;
  status: string | null;
}

export interface AdminVendedor {
  id: string;
  nombre: string | null;
  apellido: string | null;
  nombre_concesionario: string | null;
  email: string | null;
  telefono: string | null;
  region: string | null;
  comuna: string | null;
  marcas: string | null;
  estado: string | null;
  ofertas: number;
  ganadas: number;
}

export interface AdminOverview {
  leadsOferta: number;
  vendedoresTotal: number;
  vendedoresActivos: number;
  ofertas: number;
}

const GANADAS = ["ganadora", "aceptada"];

async function assertAdmin(): Promise<boolean> {
  return (await getAdminEmail()) !== null;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  if (PREVIEW_MODE) return previewAdminOverview(); // PREVIEW_MODE
  if (!(await assertAdmin())) {
    return { leadsOferta: 0, vendedoresTotal: 0, vendedoresActivos: 0, ofertas: 0 };
  }
  const db = createServiceClient();
  const [leads, vendTotal, vendActivos, ofertas] = await Promise.all([
    db.from("leads").select("id", { count: "exact", head: true }).eq("status", "pagado"),
    db.from("leads_vendors").select("id", { count: "exact", head: true }),
    db.from("leads_vendors").select("id", { count: "exact", head: true }).eq("estado", "activo"),
    db.from("ofertas").select("id", { count: "exact", head: true }),
  ]);
  return {
    leadsOferta: leads.count ?? 0,
    vendedoresTotal: vendTotal.count ?? 0,
    vendedoresActivos: vendActivos.count ?? 0,
    ofertas: ofertas.count ?? 0,
  };
}

export async function getLeadsOferta(): Promise<AdminLead[]> {
  if (PREVIEW_MODE) return previewAdminLeads(); // PREVIEW_MODE
  if (!(await assertAdmin())) return [];
  const db = createServiceClient();
  const { data, error } = await db
    .from("leads")
    .select("id, created_at, first_name, last_name, email, telefono, target_model, region, comuna, financing, status")
    .eq("status", "pagado")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getLeadsOferta:", error.message);
    return [];
  }
  return (data ?? []) as AdminLead[];
}

export async function getVendedores(): Promise<AdminVendedor[]> {
  if (PREVIEW_MODE) return previewAdminVendedores(); // PREVIEW_MODE
  if (!(await assertAdmin())) return [];
  const db = createServiceClient();
  const [{ data: vendedores, error: vErr }, { data: ofertas, error: oErr }] = await Promise.all([
    db
      .from("leads_vendors")
      .select("id, nombre, apellido, nombre_concesionario, email, telefono, region, comuna, marcas, estado")
      .order("created_at", { ascending: false }),
    db.from("ofertas").select("vendor_id, estado"),
  ]);
  if (vErr) {
    console.error("getVendedores:", vErr.message);
    return [];
  }
  if (oErr) console.error("getVendedores/ofertas:", oErr.message);

  // Agregado de ofertas por vendedor (escala chica: en memoria).
  const porVendor = new Map<string, { ofertas: number; ganadas: number }>();
  for (const o of ofertas ?? []) {
    const v = o.vendor_id as string | null;
    if (!v) continue;
    const acc = porVendor.get(v) ?? { ofertas: 0, ganadas: 0 };
    acc.ofertas += 1;
    if (GANADAS.includes((o.estado as string) ?? "")) acc.ganadas += 1;
    porVendor.set(v, acc);
  }

  return (vendedores ?? []).map((v) => ({
    ...v,
    ofertas: porVendor.get(v.id)?.ofertas ?? 0,
    ganadas: porVendor.get(v.id)?.ganadas ?? 0,
  })) as AdminVendedor[];
}
