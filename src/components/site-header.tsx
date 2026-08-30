"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"

export function SiteHeader({ title, badge }: { title: string; badge?: string }) {
  return (
    <header className="bg-background/80 sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center border-b backdrop-blur-md transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
        <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>
        {badge && (
          <Badge variant="outline" className="ml-1 font-normal">
            {badge}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
