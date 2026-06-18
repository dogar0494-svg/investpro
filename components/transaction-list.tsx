import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDateTime } from "@/lib/format"
import type { Transaction, TxType, TxStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const TYPE_META: Record<TxType, { icon: string; label: string; tone: string }> = {
  deposit: { icon: "fa-arrow-down", label: "Deposit", tone: "text-success" },
  withdrawal: { icon: "fa-arrow-up", label: "Withdrawal", tone: "text-warning" },
  investment: { icon: "fa-layer-group", label: "Investment", tone: "text-accent" },
  profit: { icon: "fa-sack-dollar", label: "Profit", tone: "text-success" },
  referral: { icon: "fa-users", label: "Referral bonus", tone: "text-primary" },
}

function statusVariant(status: TxStatus): string {
  switch (status) {
    case "approved":
    case "completed":
      return "bg-success/15 text-success"
    case "pending":
      return "bg-warning/15 text-warning"
    case "rejected":
      return "bg-destructive/15 text-destructive"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function isCredit(t: Transaction) {
  return t.type === "deposit" || t.type === "profit" || t.type === "referral"
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <i className="fa-solid fa-receipt text-2xl text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">No transactions yet.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-border/60">
      {transactions.map((t) => {
        const meta = TYPE_META[t.type]
        const credit = isCredit(t)
        return (
          <li key={t.id} className="flex items-center gap-3 py-3">
            <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted", meta.tone)}>
              <i className={`fa-solid ${meta.icon}`} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{t.description || meta.label}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(t.created_at)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={cn("text-sm font-semibold", credit ? "text-success" : "text-foreground")}>
                {credit ? "+" : "-"}
                {formatCurrency(t.amount)}
              </span>
              <Badge className={cn("text-[10px] capitalize", statusVariant(t.status))}>{t.status}</Badge>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
