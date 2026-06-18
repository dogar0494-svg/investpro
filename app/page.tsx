import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import { getPlans } from "@/lib/data"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const plans = await getPlans()

  const features = [
    {
      icon: "fa-shield-halved",
      title: "Secure & Trusted",
      desc: "Bank-grade security with manual deposit verification and protected withdrawals.",
    },
    {
      icon: "fa-chart-line",
      title: "Daily Returns",
      desc: "Earn fixed daily profit on every active plan, credited automatically to your wallet.",
    },
    {
      icon: "fa-bolt",
      title: "Fast Payouts",
      desc: "Withdraw via JazzCash or Easypaisa with quick admin approval.",
    },
    {
      icon: "fa-users",
      title: "Referral Rewards",
      desc: "Invite friends and earn a bonus on every successful referral deposit.",
    },
  ]

  const steps = [
    { icon: "fa-user-plus", title: "Create account", desc: "Sign up in under a minute with your details." },
    { icon: "fa-wallet", title: "Deposit funds", desc: "Add money via JazzCash or Easypaisa and upload proof." },
    { icon: "fa-layer-group", title: "Choose a plan", desc: "Pick an investment plan that matches your budget." },
    { icon: "fa-sack-dollar", title: "Earn daily", desc: "Watch your wallet grow with daily returns." },
  ]

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <BrandLogo />
          <nav className="flex items-center gap-2">
            {user ? (
              <Button nativeButton={false} render={<Link href="/dashboard">Dashboard</Link>} />
            ) : (
              <>
                <Button variant="ghost" nativeButton={false} render={<Link href="/login">Sign in</Link>} />
                <Button nativeButton={false} render={<Link href="/register">Get started</Link>} />
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-6">
            <Badge className="w-fit bg-primary/15 text-primary hover:bg-primary/15">
              <i className="fa-solid fa-star mr-1.5" aria-hidden="true" /> Trusted by investors across Pakistan
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Grow your wealth with <span className="text-primary">smart investments</span>
            </h1>
            <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              InvestPro makes it simple to invest and earn daily returns. Flexible plans, secure deposits, and fast
              payouts — all in one platform.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" nativeButton={false} render={<Link href="/register" />}>
                Start investing <i className="fa-solid fa-arrow-right ml-2" aria-hidden="true" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link href="#plans" />}>
                View plans
              </Button>
            </div>
            <div className="mt-2 flex gap-8">
              <div>
                <p className="text-2xl font-bold">10K+</p>
                <p className="text-sm text-muted-foreground">Active investors</p>
              </div>
              <div>
                <p className="text-2xl font-bold">Rs 50M+</p>
                <p className="text-sm text-muted-foreground">Paid out</p>
              </div>
              <div>
                <p className="text-2xl font-bold">6%</p>
                <p className="text-sm text-muted-foreground">Daily returns</p>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary/10 blur-3xl" aria-hidden="true" />
            <Image
              src="/hero-dashboard.png"
              alt="InvestPro portfolio dashboard preview"
              width={720}
              height={540}
              priority
              className="relative w-full rounded-2xl border border-border/60 shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">Why choose InvestPro</h2>
          <p className="mt-2 text-muted-foreground">Everything you need to invest with confidence.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardContent className="flex flex-col gap-3 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <i className={`fa-solid ${f.icon} text-lg`} aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">Investment plans</h2>
          <p className="mt-2 text-muted-foreground">Pick a plan that fits your goals and budget.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative border-border/60 ${plan.featured ? "ring-2 ring-primary" : ""}`}
            >
              {plan.featured && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Most popular
                </Badge>
              )}
              <CardContent className="flex flex-col gap-4 p-6">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${plan.color}22`, color: plan.color }}
                >
                  <i className={`fa-solid ${plan.icon} text-xl`} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(plan.min_deposit)} – {formatCurrency(plan.max_deposit)}
                  </p>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-extrabold text-primary">{plan.daily_profit}%</span>
                  <span className="mb-1 text-sm text-muted-foreground">/ day</span>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-success" aria-hidden="true" /> {plan.duration_days} days
                    duration
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-success" aria-hidden="true" /> {plan.total_return}% total
                    return
                  </li>
                  <li className="flex items-center gap-2">
                    <i className="fa-solid fa-check text-success" aria-hidden="true" /> Daily auto payouts
                  </li>
                </ul>
                <Button
                  className="mt-2 w-full"
                  variant={plan.featured ? "default" : "outline"}
                  nativeButton={false}
                  render={<Link href="/register">Invest now</Link>}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="mt-2 text-muted-foreground">Start earning in four simple steps.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Card key={s.title} className="border-border/60">
              <CardContent className="flex flex-col gap-3 p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <i className={`fa-solid ${s.icon} text-lg`} aria-hidden="true" />
                  </span>
                  <span className="text-3xl font-extrabold text-muted-foreground/30">{i + 1}</span>
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <Card className="border-primary/30 bg-primary/10">
          <CardContent className="flex flex-col items-center gap-5 p-10 text-center">
            <h2 className="text-balance text-3xl font-bold">Ready to start growing your money?</h2>
            <p className="max-w-md text-muted-foreground">
              Join thousands of investors earning daily returns with InvestPro.
            </p>
            <Button size="lg" nativeButton={false} render={<Link href="/register">Create your free account</Link>} />
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <BrandLogo />
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} InvestPro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
