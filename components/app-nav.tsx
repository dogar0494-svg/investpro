"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "fa-gauge" },
  { href: "/plans", label: "Plans", icon: "fa-layer-group" },
  { href: "/profile", label: "Profile", icon: "fa-user" },
]

export function AppNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links = isAdmin ? [...LINKS, { href: "/admin", label: "Admin", icon: "fa-shield-halved" }] : LINKS

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <BrandLogo href="/dashboard" />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <i className={`fa-solid ${l.icon}`} aria-hidden="true" />
                {l.label}
              </Link>
            )
          })}
          <form action={signOut} className="ml-2">
            <Button type="submit" variant="outline" size="sm">
              <i className="fa-solid fa-right-from-bracket mr-1.5" aria-hidden="true" /> Sign out
            </Button>
          </form>
        </nav>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"} text-lg`} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <nav className="border-t border-border/60 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => {
              const active = pathname === l.href
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <i className={`fa-solid ${l.icon}`} aria-hidden="true" />
                  {l.label}
                </Link>
              )
            })}
            <form action={signOut} className="mt-1">
              <Button type="submit" variant="outline" size="sm" className="w-full">
                <i className="fa-solid fa-right-from-bracket mr-1.5" aria-hidden="true" /> Sign out
              </Button>
            </form>
          </div>
        </nav>
      )}
    </header>
  )
}
