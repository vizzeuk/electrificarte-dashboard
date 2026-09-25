"use client"

import * as React from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { Logo } from "@/components/logo"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  /** Texto corto a la derecha del ítem (p. ej. "En pausa"). */
  note?: string
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navGroups: NavGroup[]
  user: { name: string; role: string; email?: string }
  homeUrl: string
}

export function AppSidebar({ navGroups, user, homeUrl, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="h-(--header-height) justify-center border-b border-sidebar-border px-3 py-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-10 hover:bg-transparent active:bg-transparent">
              <Link href={homeUrl} aria-label="Electrificarte, ir al inicio del panel">
                <Logo variant="mark" className="hidden shrink-0 group-data-[collapsible=icon]:block" />
                <Logo className="group-data-[collapsible=icon]:hidden" />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0 py-3">
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
