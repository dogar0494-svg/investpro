"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { signOut } from "@/lib/actions/auth"
import { cn } from "@/lib/utils"

const DESKTOP_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "fa-house" },
  { href: "/trading", label: "Earnings", icon: "fa-bolt" },
  { href: "/team", label: "Team", icon: "fa-users" },
  { href: "/plans", label: "VIP plans", icon: "fa-layer-group" },
  { href: "/profile", label: "Profile", icon: "fa-user" },
]

const MOBILE_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "fa-house" },
  { href: "/plans", label: "VIP plans", icon: "fa-cubes" },
  { href: "/trading", label: "Earnings", icon: "fa-bolt" },
  { href: "/dashboard#withdraw", label: "Withdraw", icon: "fa-wallet" },
]

export function AppNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname()
  const links = isAdmin ? [...DESKTOP_LINKS, { href: "/admin", label: "Admin", icon: "fa-shield-halved" }] : DESKTOP_LINKS

  return (
    <>
      <header className="dashboard-nav sticky top-0 z-40">
        <div className="dashboard-nav-inner mx-auto flex w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo href="/dashboard" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {links.map((link) => {
              const active = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("dashboard-nav-link", active && "dashboard-nav-link--active")}
                >
                  <i className={`fa-solid ${link.icon}`} aria-hidden="true" />
                  {link.label}
                </Link>
              )
            })}
            <form action={signOut} className="ml-2">
              <Button type="submit" variant="outline" size="sm" className="dashboard-signout">
                <i className="fa-solid fa-right-from-bracket mr-1.5" aria-hidden="true" /> Sign out
              </Button>
            </form>
          </nav>
          <Link href="/profile" className="dashboard-mobile-profile md:hidden" aria-label="Open your profile">
            <i className="fa-solid fa-user" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <nav className="dashboard-mobile-nav md:hidden" aria-label="Mobile navigation">
        <div className="dashboard-mobile-nav-inner">
          {MOBILE_LINKS.map((link) => {
            const active = pathname === link.href || (link.href === "/dashboard" && pathname === "/dashboard")
            return (
              <Link
                key={link.label}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn("dashboard-mobile-nav-link", active && "dashboard-mobile-nav-link--active")}
              >
                <span className="dashboard-mobile-nav-icon"><i className={`fa-solid ${link.icon}`} aria-hidden="true" /></span>
                <span>{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
