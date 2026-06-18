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
import { formatCurrency } from "@/lib/format"
import type { Settings } from "@/lib/types"

export function WithdrawDialog({
  settings,
  balance,
}: {
  settings: Settings | null
  balance: number
}) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState("JazzCash")
  const [amount, setAmount] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [loading, setLoading] = useState(false)

  const min = Number(settings?.min_withdrawal ?? 500)

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount.")
    if (Number(amount) > balance) return toast.error("Insufficient wallet balance.")
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
          <Button variant="outline" className="w-full">
            <i className="fa-solid fa-arrow-up-from-bracket mr-2" aria-hidden="true" /> Withdraw
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw funds</DialogTitle>
          <DialogDescription>
            Available balance: <span className="font-semibold text-foreground">{formatCurrency(balance)}</span>. Minimum
            withdrawal {formatCurrency(min)}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Withdraw to</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JazzCash">JazzCash</SelectItem>
                <SelectItem value="Easypaisa">Easypaisa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="wd-amount">Amount (Rs)</Label>
            <Input
              id="wd-amount"
              type="number"
              min={min}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min ${min}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="wd-acc">Your account number</Label>
            <Input
              id="wd-acc"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="03XXXXXXXXX"
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
