import { BrandLogo } from "@/components/brand-logo"

export default function Loading() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-4 text-center">
      <BrandLogo />
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        Loading InvestPro…
      </div>
    </main>
  )
}
