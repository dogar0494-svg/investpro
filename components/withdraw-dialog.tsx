"use client"

import { useState } from "react"
import { submitWithdrawal } from "@/lib/actions/wallet"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatCurrency, formatUsdt, formatUsdFromPkr, getUsdtNetworkFee } from "@/lib/format"
import type { Settings } from "@/lib/types"

export function WithdrawDialog({
  settings,
  balance,
}: {
  settings: Settings | null
  balance: number
}) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState("USDT-BSC")
  const [amount, setAmount] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount.")
    if (Number(amount) > balance) return toast.error(`Insufficient balance. Available: ${formatCurrency(balance)} (${formatUsdFromPkr(balance)} USDT).`)
    if (!accountNumber) return toast.error("Enter your account number.")
    setLoading(true)
    try {
      const fd = new FormData()
      fd.set("amount", amount)
      fd.set("payment_method", method)
      fd.set("account_number", accountNumber)
      const res = await submitWithdrawal(fd)
      if (!res.ok) throw new Error(res.error)
      toast.success("Withdrawal request submitted! Awaiting admin approval.")
      setOpen(false)
      setAmount("")
      setAccountNumber("")
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
          <Button className="w-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
            <i className="fa-solid fa-arrow-up-from-bracket mr-2" aria-hidden="true" /> Withdraw
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw USDT</DialogTitle>
          <DialogDescription>
            Available balance: <span className="font-semibold text-foreground">{formatCurrency(balance)}</span> ({formatUsdFromPkr(balance)} USDT). Binance network fee: <span className="font-semibold text-foreground">{formatUsdt(getUsdtNetworkFee(method))}</span>. You receive {formatCurrency(Math.max(0, Number(amount || 0) - getUsdtNetworkFee(method) * 280))} ({formatUsdFromPkr(Math.max(0, Number(amount || 0) - getUsdtNetworkFee(method) * 280))} USDT).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Withdraw to</Label>
            <Select value={method} onValueChange={(value) => value && setMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USDT-BSC">USDT · BSC</SelectItem>
                <SelectItem value="USDT-opBNB">USDT · opBNB</SelectItem>
                <SelectItem value="USDT-POL">USDT · Polygon (POL)</SelectItem>
                <SelectItem value="USDT-TRC20">USDT · TRC20</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="wd-amount">Amount (PKR)</Label>
            <Input
              id="wd-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 7000"
            />
            <p className="text-xs text-muted-foreground">Approximate USDT: {formatUsdFromPkr(Number(amount || 0))}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="wd-acc">Your USDT wallet address</Label>
            <Input
              id="wd-acc"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="0x... or T..."
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Request withdrawal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
