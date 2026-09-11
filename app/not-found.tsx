import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand-logo"

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-4 text-center">
      <BrandLogo />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/30 text-accent-foreground">
        <i className="fa-solid fa-compass text-2xl" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">The page may have moved or the link may be outdated.</p>
      </div>
      <Button nativeButton={false} render={<Link href="/" />}>Return home</Button>
    </main>
  )
}
