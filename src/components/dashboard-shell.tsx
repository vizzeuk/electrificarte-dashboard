"use client"

import { AppSidebar, type NavGroup } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

interface DashboardShellProps {
  navGroups: NavGroup[]
  user: { name: string; role: string }
  homeUrl: string
  sidebarTitle: string
  pageTitle: string
  badge?: string
  children: React.ReactNode
}

export function DashboardShell({
  navGroups,
  user,
  homeUrl,
  sidebarTitle,
  pageTitle,
  badge,
  children,
}: DashboardShellProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--sidebar-width-icon": "3rem",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
    >
      <AppSidebar navGroups={navGroups} user={user} homeUrl={homeUrl} title={sidebarTitle} />
      <SidebarInset>
        <SiteHeader title={pageTitle} badge={badge} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
