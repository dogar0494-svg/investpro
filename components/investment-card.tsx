import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/format"
import type { Investment } from "@/lib/types"

export function InvestmentCard({ investment }: { investment: Investment }) {
  const start = new Date(investment.start_date).getTime()
  const end = new Date(investment.end_date).getTime()
  const now = Date.now()
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
  const dailyAmount = (Number(investment.amount) * Number(investment.plan_daily_profit)) / 100
  const completed = investment.status === "completed"

  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{investment.plan_name}</h3>
          <p className="text-sm text-muted-foreground">{formatCurrency(investment.amount)} invested</p>
        </div>
        <Badge className={completed ? "bg-muted text-muted-foreground" : "bg-success/15 text-success"}>
          {completed ? "Completed" : "Active"}
        </Badge>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-muted/40 p-2">
          <p className="text-xs text-muted-foreground">Daily</p>
          <p className="text-sm font-semibold text-success">{formatCurrency(dailyAmount)}</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <p className="text-xs text-muted-foreground">Earned</p>
          <p className="text-sm font-semibold">{formatCurrency(investment.profit_earned)}</p>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <p className="text-xs text-muted-foreground">Days left</p>
          <p className="text-sm font-semibold">{completed ? 0 : daysLeft}</p>
        </div>
      </div>

      <Progress value={completed ? 100 : pct} className="h-2" />
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(investment.start_date)}</span>
        <span>{formatDate(investment.end_date)}</span>
      </div>
    </div>
  )
}
