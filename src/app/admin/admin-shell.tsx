"use client";

import { LayoutDashboard, Sparkles, ShoppingBag, Store, BarChart3 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { NavGroup } from "@/components/app-sidebar";

const navGroups: NavGroup[] = [
  {
    label: "Panel Administrador",
    items: [
      { title: "Resumen", url: "/admin", icon: LayoutDashboard },
      { title: "Analítica del sitio", url: "/admin/analitica", icon: BarChart3 },
      { title: "Leads Asesoría", url: "/admin/leads-asesoria", icon: Sparkles },
      { title: "Leads Oferta", url: "/admin/leads-oferta", icon: ShoppingBag },
      { title: "Vendedores", url: "/admin/vendedores", icon: Store },
    ],
  },
];

export function AdminShell({
  user,
  children,
}: {
  user: { name: string; role: string; email?: string };
  children: React.ReactNode;
}) {
  return (
    <DashboardShell
      navGroups={navGroups}
      user={user}
      homeUrl="/admin"
      sidebarTitle="Panel Administrador"
      pageTitle="Panel Administrador"
      badge="Datos de prueba"
    >
      {children}
    </DashboardShell>
  );
}
