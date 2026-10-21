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
import { getUsdtNetworkFee, formatUsdt } from "@/lib/format"

export function DepositDialog({ settings, userId }: { settings: Settings | null; userId: string }) {
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState("USDT-BSC")
  const [amount, setAmount] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const networkDetails = {
    "USDT-BSC": { label: "USDT · BSC", address: settings?.usdt_bsc_address },
    "USDT-opBNB": { label: "USDT · opBNB", address: settings?.usdt_opbnb_address },
    "USDT-POL": { label: "USDT · Polygon (POL)", address: settings?.usdt_polygon_address },
    "USDT-TRC20": { label: "USDT · TRC20", address: settings?.usdt_trc20_address },
  } as const
  const accountInfo = networkDetails[method as keyof typeof networkDetails]

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

      toast.success("USDT deposit submitted! Awaiting admin approval.")
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
          <DialogTitle>Deposit USDT</DialogTitle>
          <DialogDescription>Send USDT from Binance to the selected address and network, then upload your transaction proof.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Payment method</Label>
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

          <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <p className="text-muted-foreground">Send from Binance to:</p>
            <p className="mt-1 font-semibold">{accountInfo.label}</p>
            <p className="break-all font-mono text-base text-primary">{accountInfo.address ?? "Address not configured"}</p>
            <p className="mt-2 text-xs text-muted-foreground">Binance withdrawal fee: {formatUsdt(getUsdtNetworkFee(method))}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dep-amount">Amount (USDT)</Label>
            <Input
              id="dep-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 25.00"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dep-acc">Your sending wallet address (optional)</Label>
            <Input
              id="dep-acc"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="0x... or T..."
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
