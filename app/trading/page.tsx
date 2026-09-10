import { getCurrentUser } from "@/lib/data"
import { AppNav } from "@/components/app-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/sonner"
import { formatCurrency } from "@/lib/format"

const assets = [
  { symbol: "BTC", name: "Bitcoin", price: 67240.18, change: "+4.82%", color: "bg-primary", points: "0,74 18,68 36,72 54,53 72,60 90,38 108,44 126,25 144,34 162,12 180,18 198,4" },
  { symbol: "ETH", name: "Ethereum", price: 3528.42, change: "+2.31%", color: "bg-warning", points: "0,70 18,64 36,66 54,57 72,61 90,42 108,48 126,32 144,38 162,25 180,30 198,16" },
  { symbol: "TRX", name: "TRON", price: 0.1634, change: "+1.08%", color: "bg-success", points: "0,58 18,62 36,48 54,53 72,39 90,43 108,27 126,35 144,23 162,29 180,15 198,20" },
  { symbol: "SOL", name: "Solana", price: 146.72, change: "-0.84%", color: "bg-accent", points: "0,28 18,38 36,31 54,45 72,39 90,52 108,45 126,64 144,52 162,68 180,59 198,76" },
]

function MarketChart({ points }: { points: string }) {
  return (
    <svg viewBox="0 0 200 90" className="h-40 w-full" role="img" aria-label="Market price chart">
      <path d="M0 82H200M0 55H200M0 28H200" stroke="currentColor" strokeOpacity=".1" strokeWidth="1" />
      <polyline points={points} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${points} 198,90 0,90`} fill="var(--primary)" fillOpacity=".08" stroke="none" />
    </svg>
  )
}

export default async function TradingPage() {
  const { profile } = await getCurrentUser()
  const featured = assets[0]

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-20 md:pb-0">
      <AppNav isAdmin={profile.role === "admin"} />
      <Toaster position="top-center" richColors />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-5 sm:px-4 sm:py-8">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Market desk</p>
            <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">Crypto trading</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track the market at a glance.</p>
          </div>
          <Badge className="shrink-0 bg-primary/10 text-primary hover:bg-primary/10">{formatCurrency(profile.wallet_balance)}</Badge>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Assets">
          {assets.map((asset, index) => (
            <button key={asset.symbol} className={`min-w-[92px] rounded-xl border px-3 py-2 text-left transition-colors ${index === 0 ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}>
              <span className="block text-xs font-bold">{asset.symbol}</span>
              <span className="mt-1 block text-[11px] opacity-75">{asset.change}</span>
            </button>
          ))}
        </div>

        <Card className="mb-4 overflow-hidden border-primary/20 bg-card shadow-[0_16px_40px_var(--shadow-color)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">₿</span><span className="text-sm font-semibold">{featured.name} / USDT</span></div>
                <p className="mt-4 text-3xl font-extrabold tracking-tight">${featured.price.toLocaleString()}</p>
              </div>
              <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">{featured.change}</span>
            </div>
            <div className="mt-3 text-muted-foreground"><MarketChart points={featured.points} /></div>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>1D</span><span>1W</span><span>1M</span><span>1Y</span></div>
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">24h high</p><p className="mt-1 font-bold">$68,940.22</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">24h low</p><p className="mt-1 font-bold">$64,108.30</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Market sentiment</p><p className="mt-1 font-bold text-success">Bullish</p></CardContent></Card>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {assets.slice(1).map((asset) => <Card key={asset.symbol}><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${asset.color}`} /><span className="font-bold">{asset.symbol}</span></div><span className="text-xs font-semibold text-success">{asset.change}</span></div><p className="mt-3 text-lg font-bold">${asset.price.toLocaleString()}</p><div className="mt-2 h-10 text-muted-foreground"><MarketChart points={asset.points} /></div></CardContent></Card>)}
        </div>
      </main>
    </div>
  )
}
