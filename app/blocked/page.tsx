import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { BrandLogo } from "@/components/brand-logo"

export default function BlockedPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <BrandLogo />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <i className="fa-solid fa-ban text-2xl" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Account suspended</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Your account has been blocked by an administrator. Please contact support if you believe this is a mistake.
        </p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  )
}
