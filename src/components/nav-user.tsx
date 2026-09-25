"use client"

import { ChevronsUpDown, LogOut } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  const letras = partes.length > 1 ? partes[0][0] + partes[1][0] : nombre.slice(0, 2)
  return letras.toLocaleUpperCase("es-CL")
}

export function NavUser({
  user,
}: {
  user: { name: string; role: string; email?: string }
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="cursor-pointer">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-control border border-sidebar-border bg-background text-label font-semibold">
                {iniciales(user.name)}
              </span>
              <span className="grid flex-1 text-left leading-tight">
                <span className="truncate text-small font-semibold">{user.name}</span>
                <span className="text-muted-foreground truncate text-micro">{user.role}</span>
              </span>
              <ChevronsUpDown className="text-muted-foreground ml-auto size-4" strokeWidth={1.5} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
            <DropdownMenuLabel className="font-normal">
              <span className="grid leading-tight">
                <span className="truncate text-small font-semibold">{user.name}</span>
                {user.email && <span className="text-muted-foreground truncate text-micro">{user.email}</span>}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action="/auth/signout" method="post">
              <DropdownMenuItem asChild className="cursor-pointer">
                <button type="submit" className="w-full">
                  <LogOut strokeWidth={1.5} />
                  Cerrar sesión
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
