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
      <SidebarHeader className="border-b border-sidebar-border/60 p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="gap-2.5 hover:bg-transparent active:bg-transparent">
              <Link href={homeUrl}>
                {/* Colapsado: isotipo. */}
                <div className="hidden aspect-square size-8 shrink-0 items-center justify-center rounded-xl bg-black shadow-sm group-data-[collapsible=icon]:flex">
                  <Logo size={18} />
                </div>
                {/* Expandido: solo el logo real, usando todo el alto de la fila. */}
                <div className="flex flex-1 items-center group-data-[collapsible=icon]:hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo-electrificarte.webp"
                    alt="Electrificarte"
                    className="h-8 w-auto object-contain object-left brightness-0 dark:brightness-0 dark:invert"
                  />
                  <span className="sr-only">{title}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-1 py-2">
        {navGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
