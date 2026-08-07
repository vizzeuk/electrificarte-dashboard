"use client"

import { LayoutDashboard, Users, Handshake, BarChart3 } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import type { NavGroup } from "@/components/app-sidebar"

const navGroups: NavGroup[] = [
  {
    label: "Panel Vendedor",
    items: [
      { title: "Resumen", url: "/vendedor", icon: LayoutDashboard },
      { title: "Analítica del sitio", url: "/vendedor/analitica", icon: BarChart3 },
      { title: "Leads activos", url: "/vendedor/leads-activos", icon: Users },
      { title: "Leads disponibles", url: "/vendedor/leads-disponibles", icon: Handshake },
    ],
  },
]

export default function VendedorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navGroups={navGroups}
      user={{ name: "AutoMax Ñuñoa", role: "Vendedor oficial" }}
      homeUrl="/vendedor"
      sidebarTitle="Panel Vendedor"
      pageTitle="Panel Vendedor"
      badge="Datos de prueba"
    >
      {children}
    </DashboardShell>
  )
}
