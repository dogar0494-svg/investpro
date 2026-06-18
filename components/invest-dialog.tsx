"use client"

import { useState } from "react"
import { investInPlan } from "@/lib/actions/wallet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/format"
import type { Plan } from "@/lib/types"

export function InvestDialog({
  plan,
  balance,
  featured,
}: {
  plan: Plan
  balance: number
  featured?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(String(plan.min_deposit))
  const [loading, setLoading] = useState(false)

  const amt = Number(amount) || 0
  const dailyAmount = (amt * Number(plan.daily_profit)) / 100
  const totalProfit = dailyAmount * Number(plan.duration_days)

  async function handleSubmit() {
    if (amt < Number(plan.min_deposit) || amt > Number(plan.max_deposit)) {
      return toast.error(`Amount must be between ${formatCurrency(plan.min_deposit)} and ${formatCurrency(plan.max_deposit)}.`)
    }
    if (amt > balance) return toast.error("Insufficient wallet balance. Please deposit first.")
    setLoading(true)
    try {
      const fd = new FormData()
      fd.set("plan_id", plan.id)
      fd.set("amount", amount)
      const res = await investInPlan(fd)
      if (!res.ok) throw new Error(res.error)
      toast.success(`Invested ${formatCurrency(amt)} in ${plan.name}!`)
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="w-full" variant={featured ? "default" : "outline"}>
            Invest now
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invest in {plan.name}</DialogTitle>
          <DialogDescription>
            Daily profit {plan.daily_profit}% for {plan.duration_days} days. Available balance{" "}
            {formatCurrency(balance)}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="inv-amount">Amount (Rs)</Label>
            <Input
              id="inv-amount"
              type="number"
              min={plan.min_deposit}
              max={plan.max_deposit}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Range {formatCurrency(plan.min_deposit)} – {formatCurrency(plan.max_deposit)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">Daily profit</p>
              <p className="text-base font-semibold text-success">{formatCurrency(dailyAmount)}</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-xs text-muted-foreground">Total profit</p>
              <p className="text-base font-semibold text-success">{formatCurrency(totalProfit)}</p>
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Investing..." : `Confirm investment`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
