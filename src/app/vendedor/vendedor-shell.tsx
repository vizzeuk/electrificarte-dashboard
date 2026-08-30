"use client";

import { LayoutDashboard, Users, Handshake, BarChart3 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { NavGroup } from "@/components/app-sidebar";

const navGroups: NavGroup[] = [
  {
    label: "Panel Vendedor",
    items: [
      { title: "Resumen", url: "/vendedor", icon: LayoutDashboard },
      { title: "Analítica del sitio", url: "/vendedor/analitica", icon: BarChart3 },
      { title: "Mis ofertas", url: "/vendedor/leads-activos", icon: Users },
      { title: "Leads disponibles", url: "/vendedor/leads-disponibles", icon: Handshake },
    ],
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
    <DashboardShell
      navGroups={navGroups}
      user={user}
      homeUrl="/vendedor"
      sidebarTitle="Panel Vendedor"
      pageTitle="Panel Vendedor"
    >
      {children}
    </DashboardShell>
  );
}
