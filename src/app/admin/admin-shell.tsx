"use client";

import {
  BarChart3,
  LayoutDashboard,
  ListChecks,
  Mail,
  MessageSquareText,
  PauseCircle,
  Sparkles,
  Star,
  Store,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard-shell";
import type { NavGroup } from "@/components/app-sidebar";

const navGroups: NavGroup[] = [
  {
    label: "General",
    items: [{ title: "Resumen", url: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Personas interesadas",
    items: [
      { title: "Waitlist", url: "/admin/waitlist", icon: ListChecks },
      { title: "Asesorías", url: "/admin/asesorias", icon: Sparkles },
      { title: "Newsletter", url: "/admin/newsletter", icon: Mail },
      { title: "Feedback del sitio", url: "/admin/feedback", icon: MessageSquareText },
    ],
  },
  {
    label: "Red de vendedores",
    items: [
      { title: "Vendedores", url: "/admin/vendedores", icon: Store },
      { title: "Leads Oferta", url: "/admin/leads-oferta", icon: PauseCircle, note: "En pausa" },
    ],
  },
  {
    label: "Contenido",
    items: [
      { title: "Reseñas", url: "/admin/resenas", icon: Star },
      { title: "Analítica del sitio", url: "/admin/analitica", icon: BarChart3, note: "De prueba" },
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
    <DashboardShell navGroups={navGroups} user={user} homeUrl="/admin" panelLabel="Administración">
      {children}
    </DashboardShell>
  );
}
