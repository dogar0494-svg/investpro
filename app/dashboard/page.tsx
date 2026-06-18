import Link from "next/link"
import { getCurrentUser, getSettings, getTransactions, getInvestments } from "@/lib/data"
import { AppNav } from "@/components/app-nav"
import { DepositDialog } from "@/components/deposit-dialog"
import { WithdrawDialog } from "@/components/withdraw-dialog"
import { TransactionList } from "@/components/transaction-list"
import { InvestmentCard } from "@/components/investment-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { formatCurrency } from "@/lib/format"

export default async function DashboardPage() {
  const { profile } = await getCurrentUser()
  const [settings, transactions, investments] = await Promise.all([
    getSettings(),
    getTransactions(profile.id),
    getInvestments(profile.id),
  ])

  const activeInvestments = investments.filter((i) => i.status === "active")

  const stats = [
    { label: "Wallet Balance", value: profile.wallet_balance, icon: "fa-wallet", tone: "text-primary" },
    { label: "Total Invested", value: profile.total_invested, icon: "fa-layer-group", tone: "text-accent" },
    { label: "Total Profit", value: profile.total_profit, icon: "fa-sack-dollar", tone: "text-success" },
  ]

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppNav isAdmin={profile.role === "admin"} />
      <Toaster position="top-center" richColors />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Welcome back, {profile.name?.split(" ")[0] || profile.username || "investor"}
          </h1>
          <p className="text-sm text-muted-foreground">Here&apos;s an overview of your account.</p>
        </div>

        {/* Balance hero */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/15 to-card">
          <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-primary-foreground/70">Wallet Balance</p>
              <p className="mt-1 text-4xl font-extrabold">{formatCurrency(profile.wallet_balance)}</p>
            </div>
            <div className="flex w-full gap-3 sm:w-auto">
              <div className="w-full sm:w-32">
                <DepositDialog settings={settings} userId={profile.id} />
              </div>
              <div className="w-full sm:w-32">
                <WithdrawDialog settings={settings} balance={Number(profile.wallet_balance)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="flex items-center gap-4 p-5">
                <span className={`flex h-12 w-12 items-center justify-center rounded-lg bg-muted ${s.tone}`}>
                  <i className={`fa-solid ${s.icon} text-lg`} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{formatCurrency(s.value)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Active investments */}
          <section className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Active Investments</h2>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/plans" />}>
                Invest more <i className="fa-solid fa-arrow-right ml-1.5" aria-hidden="true" />
              </Button>
            </div>
            {activeInvestments.length === 0 ? (
              <Card className="border-border/60">
                <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                  <i className="fa-solid fa-seedling text-2xl text-muted-foreground" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">You have no active investments yet.</p>
                  <Button nativeButton={false} render={<Link href="/plans">Browse plans</Link>} />
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {activeInvestments.map((inv) => (
                  <InvestmentCard key={inv.id} investment={inv} />
                ))}
              </div>
            )}
          </section>

          {/* Recent transactions */}
          <section className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
            <Card className="border-border/60">
              <CardHeader className="pb-0">
                <CardTitle className="sr-only">Transactions</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <TransactionList transactions={transactions.slice(0, 8)} />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
