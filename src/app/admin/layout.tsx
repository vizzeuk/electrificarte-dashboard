"use client"

import { LayoutDashboard, Sparkles, ShoppingBag, Store } from "lucide-react"
import { DashboardShell } from "@/components/dashboard-shell"
import type { NavGroup } from "@/components/app-sidebar"

const navGroups: NavGroup[] = [
  {
    label: "Panel Administrador",
    items: [
      { title: "Resumen", url: "/admin", icon: LayoutDashboard },
      { title: "Leads Asesoría", url: "/admin/leads-asesoria", icon: Sparkles },
      { title: "Leads Oferta", url: "/admin/leads-oferta", icon: ShoppingBag },
      { title: "Vendedores", url: "/admin/vendedores", icon: Store },
    ],
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell
      navGroups={navGroups}
      user={{ name: "Francisco", role: "Administrador" }}
      homeUrl="/admin"
      sidebarTitle="Panel Administrador"
      pageTitle="Panel Administrador"
      badge="Datos de prueba"
    >
      {children}
    </DashboardShell>
  )
}
