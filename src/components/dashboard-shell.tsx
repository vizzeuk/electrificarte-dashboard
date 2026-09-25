"use client"

import { AppSidebar, type NavGroup } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

interface DashboardShellProps {
  navGroups: NavGroup[]
  user: { name: string; role: string; email?: string }
  homeUrl: string
  /** Nombre del panel ("Administración", "Vendedor oficial"): va en el header. */
  panelLabel: string
  children: React.ReactNode
}

export function DashboardShell({ navGroups, user, homeUrl, panelLabel, children }: DashboardShellProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3.5rem",
          "--header-height": "4rem",
        } as React.CSSProperties
      }
    >
      <AppSidebar navGroups={navGroups} user={user} homeUrl={homeUrl} />
      <SidebarInset className="min-w-0">
        <SiteHeader navGroups={navGroups} panelLabel={panelLabel} />
        <main className="flex flex-1 flex-col">
          <div className="mx-auto flex w-full max-w-page flex-1 flex-col gap-8 px-5 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
