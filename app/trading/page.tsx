import { getCurrentUser, getPlans } from "@/lib/data"
import { AppNav } from "@/components/app-nav"
import { InvestDialog } from "@/components/invest-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/sonner"
import { formatCurrency } from "@/lib/format"

export default async function TradingPage() {
  const { profile } = await getCurrentUser()
  const plans = await getPlans()

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-20 md:pb-0">
      <AppNav isAdmin={profile.role === "admin"} />
      <Toaster position="top-center" richColors />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Market desk</p>
            <h1 className="text-2xl font-bold text-balance">Trading plans</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose a strategy and put your balance to work.</p>
          </div>
          <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Available: {formatCurrency(profile.wallet_balance)}</Badge>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative flex flex-col border-border/60 ${plan.featured ? "ring-2 ring-primary" : ""}`}>
              {plan.featured && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">Featured</Badge>}
              <CardContent className="flex flex-1 flex-col gap-4 p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: `${plan.color}22`, color: plan.color }}>
                  <i className={`fa-solid ${plan.icon} text-xl`} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">{plan.name}</h2>
                  <p className="text-sm text-muted-foreground">{formatCurrency(plan.min_deposit)} – {formatCurrency(plan.max_deposit)}</p>
                </div>
                <div className="flex items-end gap-1"><span className="text-3xl font-extrabold text-primary">{plan.daily_profit}%</span><span className="mb-1 text-sm text-muted-foreground">/ day</span></div>
                <p className="flex-1 text-sm text-muted-foreground">{plan.duration_days} days · {plan.total_return}% total return</p>
                <InvestDialog plan={plan} balance={Number(profile.wallet_balance)} featured={plan.featured} />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
