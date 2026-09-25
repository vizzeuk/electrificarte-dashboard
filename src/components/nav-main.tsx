"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { NavItem } from "@/components/app-sidebar"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

/** Un ítem está activo en su ruta exacta o en cualquier subruta (salvo el inicio del panel). */
export function isActivePath(pathname: string, url: string): boolean {
  if (pathname === url) return true
  const depth = url.split("/").filter(Boolean).length
  return depth > 1 && pathname.startsWith(`${url}/`)
}

export function NavMain({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarGroup className="px-3 py-2">
      <SidebarGroupLabel className="px-2">{label}</SidebarGroupLabel>
      <SidebarMenu className="gap-0.5">
        {items.map((item) => {
          const active = isActivePath(pathname, item.url)
          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={active}
                className="h-10 gap-3 border border-transparent text-small data-[active=true]:border-sidebar-border data-[active=true]:font-semibold [&>svg]:size-[18px]"
              >
                <Link
                  href={item.url}
                  aria-current={active ? "page" : undefined}
                  onClick={() => isMobile && setOpenMobile(false)}
                >
                  {item.icon && <item.icon strokeWidth={1.5} />}
                  <span>{item.title}</span>
                  {item.note && (
                    <span className="text-muted-foreground ml-auto text-micro font-normal group-data-[collapsible=icon]:hidden">
                      {item.note}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
