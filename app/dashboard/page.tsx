import Link from "next/link"
import { getCurrentUser, getSettings, getTransactions, getInvestments, getTeam } from "@/lib/data"
import { AppNav } from "@/components/app-nav"
import { DepositDialog } from "@/components/deposit-dialog"
import { WithdrawDialog } from "@/components/withdraw-dialog"
import { ImpersonationBanner } from "@/components/impersonation-banner"
import { getImpersonationContext } from "@/lib/impersonation"
import { TransactionList } from "@/components/transaction-list"
import { InvestmentCard } from "@/components/investment-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { formatCurrency, formatUsdFromPkr } from "@/lib/format"

export default async function DashboardPage() {
  const { profile } = await getCurrentUser()
  const impersonation = await getImpersonationContext()
  const viewedProfile = impersonation
    ? ((await (async () => {
        const { createAdminClient } = await import("@/lib/supabase/admin")
        const admin = createAdminClient()
        const { data } = await admin.from("profiles").select("*").eq("id", impersonation.targetId).single()
        return data
      })()) ?? profile)
    : profile

  const defaultTeam = { level1: [], level2: [], level3: [] }
  const teamPromise = viewedProfile.referral_code
    ? getTeam(viewedProfile.id, viewedProfile.referral_code)
    : Promise.resolve(defaultTeam)
  const [settingsResult, transactionsResult, investmentsResult, teamResult] = await Promise.allSettled([
    getSettings(),
    getTransactions(viewedProfile.id),
    getInvestments(viewedProfile.id),
    teamPromise,
  ])
  const settings = settingsResult.status === "fulfilled" ? settingsResult.value : null
  const transactions = transactionsResult.status === "fulfilled" ? transactionsResult.value : []
  const investments = investmentsResult.status === "fulfilled" ? investmentsResult.value : []
  const team = teamResult.status === "fulfilled" ? teamResult.value : defaultTeam
  ;[settingsResult, transactionsResult, investmentsResult, teamResult].forEach((result, index) => {
    if (result.status === "rejected") console.error(`[v0] Dashboard data load failed (${index})`, result.reason)
  })

  const activeInvestments = investments.filter((investment) => investment.status === "active")
  const isSettled = (status: string) => status === "approved" || status === "completed"
  const sumAmounts = (type: string, statuses: string[]) =>
    transactions
      .filter((transaction) => transaction.type === type && statuses.includes(transaction.status))
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0)
  const totalDeposits = sumAmounts("deposit", ["approved", "completed"])
  const totalWithdrawals = sumAmounts("withdrawal", ["approved", "completed"])
  const pendingDeposits = sumAmounts("deposit", ["pending"])
  const pendingWithdrawals = sumAmounts("withdrawal", ["pending"])
  const teamSize = (team.level1?.length ?? 0) + team.level2.length + team.level3.length

  const stats = [
    { label: "Pending deposit", value: pendingDeposits, kind: "money", icon: "fa-clock-rotate-left", status: "PENDING", tone: "blue" },
    { label: "Pending withdrawal", value: pendingWithdrawals, kind: "money", icon: "fa-hourglass-half", status: "PENDING", tone: "green" },
    { label: "Total invested", value: Number(viewedProfile.total_invested), kind: "money", icon: "fa-chart-pie", status: "ACTIVE", tone: "orange" },
    { label: "Lifetime profit", value: Number(viewedProfile.total_profit), kind: "money", icon: "fa-bolt", status: "EARNED", tone: "violet" },
    { label: "Wallet balance", value: Number(viewedProfile.wallet_balance), kind: "money", icon: "fa-wallet", status: "AVAILABLE", tone: "blue" },
    { label: "Team members", value: teamSize, kind: "count", icon: "fa-users", status: "NETWORK", tone: "green" },
  ] as const

  return (
    <div className="bubble-dashboard flex min-h-dvh flex-col overflow-x-hidden bg-background pb-28 md:pb-0">
      {impersonation && <ImpersonationBanner userName={impersonation.targetName} />}
      <AppNav isAdmin={profile.role === "admin"} />
      <Toaster position="top-center" richColors />

      <main className="dashboard-main mx-auto w-full max-w-6xl flex-1 px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
        <div className="dashboard-welcome mb-6 flex flex-col gap-1 sm:mb-8">
          <p className="dashboard-eyebrow">INVESTPRO / YOUR ACCOUNT</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {viewedProfile.name?.split(" ")[0] || viewedProfile.username || "investor"}
          </h1>
          <p className="text-sm text-muted-foreground">Your money, plans, and activity in one place.</p>
        </div>

        <section className="dashboard-summary mb-7" aria-label="Deposit and withdrawal totals">
          <Card className="dashboard-summary-card dashboard-summary-card--deposit">
            <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
              <span className="dashboard-summary-icon dashboard-summary-icon--deposit"><i className="fa-solid fa-building-columns" aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className="dashboard-summary-label">Total deposit</p>
                <p className="dashboard-summary-value">{formatCurrency(totalDeposits)}</p>
                <p className="dashboard-summary-conversion">{formatUsdFromPkr(totalDeposits)} USDT</p>
              </div>
            </CardContent>
          </Card>
          <Card className="dashboard-summary-card dashboard-summary-card--withdraw">
            <CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
              <span className="dashboard-summary-icon dashboard-summary-icon--withdraw"><i className="fa-solid fa-wallet" aria-hidden="true" /></span>
              <div className="min-w-0">
                <p className="dashboard-summary-label">Total withdrawal</p>
                <p className="dashboard-summary-value">{formatCurrency(totalWithdrawals)}</p>
                <p className="dashboard-summary-conversion">{formatUsdFromPkr(totalWithdrawals)} USDT</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="withdraw" className="dashboard-actions mb-7" aria-label="Quick actions">
          <DepositDialog settings={settings} userId={viewedProfile.id} shortcut />
          <WithdrawDialog settings={settings} balance={Number(viewedProfile.wallet_balance)} shortcut />
          <Link href="/plans" className="dashboard-shortcut dashboard-shortcut--plans">
            <span className="dashboard-shortcut-orb"><i className="fa-solid fa-layer-group" aria-hidden="true" /></span>
            <span>My plans</span>
          </Link>
          <Link href="/team" className="dashboard-shortcut dashboard-shortcut--team">
            <span className="dashboard-shortcut-orb"><i className="fa-solid fa-users" aria-hidden="true" /></span>
            <span>My team</span>
          </Link>
        </section>

        <section className="dashboard-exchange-strip mb-8" aria-label="Currency conversion information">
          <span className="dashboard-exchange-icon"><i className="fa-solid fa-arrow-right-arrow-left" aria-hidden="true" /></span>
          <div className="min-w-0 flex-1">
            <p className="dashboard-exchange-title">PKR wallet · fixed conversion</p>
            <p className="dashboard-exchange-copy">1 USD ≈ 280 PKR · USDT values are estimates</p>
          </div>
          <span className="dashboard-exchange-badge">1 : 280</span>
        </section>

        <section className="mb-9" aria-labelledby="overview-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="dashboard-eyebrow">A QUICK SNAPSHOT</p>
              <h2 id="overview-heading" className="text-xl font-bold sm:text-2xl">Overview</h2>
            </div>
            <div className="dashboard-period-pill"><i className="fa-solid fa-calendar-days" aria-hidden="true" /> All time</div>
          </div>

          <div className="dashboard-overview-grid">
            {stats.map((stat) => (
              <article key={stat.label} className={`dashboard-overview-card dashboard-overview-card--${stat.tone}`}>
                <div className="dashboard-overview-card-top">
                  <span className="dashboard-overview-icon"><i className={`fa-solid ${stat.icon}`} aria-hidden="true" /></span>
                  <span className="dashboard-overview-status">{stat.status}</span>
                </div>
                <div className="dashboard-overview-card-bottom">
                  <p className="dashboard-overview-label">{stat.label}</p>
                  <p className="dashboard-overview-value">
                    {stat.kind === "money" ? formatCurrency(stat.value) : stat.value.toLocaleString("en-US")}
                  </p>
                  {stat.kind === "money" && <p className="dashboard-overview-conversion">{formatUsdFromPkr(stat.value)} USDT</p>}
                </div>
                <i className={`dashboard-overview-watermark fa-solid ${stat.icon}`} aria-hidden="true" />
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-7 lg:grid-cols-5">
          <section className="lg:col-span-3" aria-labelledby="active-plans-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="dashboard-eyebrow">GROWING BALANCE</p>
                <h2 id="active-plans-heading" className="text-lg font-semibold">Active plans <span className="text-sm text-muted-foreground">({activeInvestments.length})</span></h2>
              </div>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/plans" />}>
                Explore plans <i className="fa-solid fa-arrow-right ml-1.5" aria-hidden="true" />
              </Button>
            </div>
            {activeInvestments.length === 0 ? (
              <Card className="dashboard-surface-card">
                <CardContent className="flex flex-col items-center gap-3 py-10 text-center sm:py-12">
                  <span className="dashboard-empty-icon"><i className="fa-solid fa-seedling" aria-hidden="true" /></span>
                  <div>
                    <p className="font-semibold">No active plans yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Choose a plan to see your progress here.</p>
                  </div>
                  <Button nativeButton={false} render={<Link href="/plans">Browse plans</Link>} />
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {activeInvestments.map((investment) => <InvestmentCard key={investment.id} investment={investment} />)}
              </div>
            )}
          </section>

          <section className="lg:col-span-2" aria-labelledby="recent-activity-heading">
            <div className="mb-4">
              <p className="dashboard-eyebrow">LATEST UPDATES</p>
              <h2 id="recent-activity-heading" className="text-lg font-semibold">Recent activity</h2>
            </div>
            <Card className="dashboard-surface-card">
              <CardHeader className="pb-0"><CardTitle className="sr-only">Recent transactions</CardTitle></CardHeader>
              <CardContent className="pt-2"><TransactionList transactions={transactions.slice(0, 8)} /></CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  )
}
