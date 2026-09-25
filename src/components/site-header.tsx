"use client"

import { usePathname } from "next/navigation"

import type { NavGroup } from "@/components/app-sidebar"
import { isActivePath } from "@/components/nav-main"
import { ModeToggle } from "@/components/mode-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader({ navGroups, panelLabel }: { navGroups: NavGroup[]; panelLabel: string }) {
  const pathname = usePathname()
  const actual = navGroups
    .flatMap((g) => g.items)
    .filter((i) => isActivePath(pathname, i.url))
    .sort((a, b) => b.url.length - a.url.length)[0]

  return (
    <header className="bg-background sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center border-b">
      <div className="flex w-full items-center gap-3 px-3 lg:px-5">
        <SidebarTrigger className="size-10 cursor-pointer [&_svg]:size-[18px]" />
        <span className="bg-border h-5 w-px" aria-hidden />
        <p className="flex min-w-0 items-center gap-2 text-small">
          <span className="text-muted-foreground hidden sm:inline">{panelLabel}</span>
          {actual && (
            <>
              <span className="text-muted-foreground hidden sm:inline" aria-hidden>/</span>
              <span className="truncate font-semibold">{actual.title}</span>
            </>
          )}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
