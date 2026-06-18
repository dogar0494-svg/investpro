"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { submitDeposit } from "@/lib/actions/wallet"
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
import type { Settings } from "@/lib/types"

export function DepositDialog({ settings, userId }: { settings: Settings | null; userId: string }) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState("JazzCash")
  const [amount, setAmount] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const accountInfo =
    method === "JazzCash"
      ? { number: settings?.jazzcash_number, name: settings?.jazzcash_name }
      : { number: settings?.easypaisa_number, name: settings?.easypaisa_name }

  async function handleSubmit() {
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount.")
    if (!file) return toast.error("Upload your payment proof screenshot.")
    setLoading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file)
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from("payment-proofs").getPublicUrl(path)

      const fd = new FormData()
      fd.set("amount", amount)
      fd.set("payment_method", method)
      fd.set("account_number", accountNumber)
      fd.set("proof_image", pub.publicUrl)
      const res = await submitDeposit(fd)
      if (!res.ok) throw new Error(res.error)

      toast.success("Deposit request submitted! Awaiting admin approval.")
      setOpen(false)
      setAmount("")
      setAccountNumber("")
      setFile(null)
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
          <Button className="w-full">
            <i className="fa-solid fa-plus mr-2" aria-hidden="true" /> Deposit
          </Button>
        }
      />
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit funds</DialogTitle>
          <DialogDescription>Send payment to the account below, then upload your proof.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Payment method</Label>
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

          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <p className="text-muted-foreground">Send payment to:</p>
            <p className="mt-1 font-semibold">{accountInfo.name ?? "InvestPro Admin"}</p>
            <p className="font-mono text-base text-primary">{accountInfo.number ?? "—"}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dep-amount">Amount (Rs)</Label>
            <Input
              id="dep-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dep-acc">Your sending number (optional)</Label>
            <Input
              id="dep-acc"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="03XXXXXXXXX"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dep-proof">Payment proof screenshot</Label>
            <Input
              id="dep-proof"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit deposit request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
