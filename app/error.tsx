"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand-logo"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[v0] Route rendering failed", error)
  }, [error])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-background px-4 text-center">
      <BrandLogo />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <i className="fa-solid fa-rotate-right text-2xl" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">We&apos;re having trouble loading this page</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Please try again. Your account and balance are safe while we reconnect.
        </p>
      </div>
      <Button type="button" onClick={() => { reset(); window.location.reload() }}>
        Try again
      </Button>
    </main>
  )
}
