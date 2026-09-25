"use client";

import { BarChart3, Handshake, LayoutDashboard, UserCog, Users } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { NavGroup } from "@/components/app-sidebar";

const navGroups: NavGroup[] = [
  {
    label: "Panel de vendedor",
    items: [
      { title: "Resumen", url: "/vendedor", icon: LayoutDashboard },
      { title: "Leads disponibles", url: "/vendedor/leads-disponibles", icon: Handshake },
      { title: "Mis ofertas", url: "/vendedor/leads-activos", icon: Users },
      { title: "Analítica del sitio", url: "/vendedor/analitica", icon: BarChart3 },
    ],
  },
  {
    label: "Cuenta",
    items: [{ title: "Mi cuenta", url: "/vendedor/mi-cuenta", icon: UserCog }],
  },
];

export function VendedorShell({
  user,
  children,
}: {
  user: { name: string; role: string; email?: string };
  children: React.ReactNode;
}) {
  return (
    <DashboardShell navGroups={navGroups} user={user} homeUrl="/vendedor" panelLabel="Vendedor oficial">
      {children}
    </DashboardShell>
  );
}
