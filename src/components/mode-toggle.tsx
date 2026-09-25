"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

/** Alterna claro/oscuro. La elección queda guardada (next-themes → localStorage). */
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  // El tema real solo se conoce en el cliente: hasta montar, se muestra el ícono neutro.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const dark = mounted && resolvedTheme === "dark"
  const label = dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"

  return (
    <Button
      variant="outline"
      size="sm"
      className="cursor-pointer gap-2"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
    >
      {dark ? <Sun strokeWidth={1.5} /> : <Moon strokeWidth={1.5} />}
      <span className="hidden sm:inline">{dark ? "Tema claro" : "Tema oscuro"}</span>
    </Button>
  )
}
