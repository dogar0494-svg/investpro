import Link from "next/link"
import { cn } from "@/lib/utils"

export function BrandLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-bold", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <i className="fa-solid fa-chart-line text-base" aria-hidden="true" />
      </span>
      <span className="text-xl tracking-tight">
        Invest<span className="text-primary">Pro</span>
      </span>
    </Link>
  )
}
