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

export interface NavGroup {
  label: string
  items: {
    title: string
    url: string
    icon?: LucideIcon
  }[]
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navGroups: NavGroup[]
  user: { name: string; role: string; email?: string }
  homeUrl: string
  title: string
}

export function AppSidebar({ navGroups, user, homeUrl, title, ...props }: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={homeUrl}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black">
                  <Logo size={18} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="font-display truncate text-base font-bold tracking-tight">Electrificarte</span>
                  <span className="truncate text-xs text-muted-foreground">{title}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
