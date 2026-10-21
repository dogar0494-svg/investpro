"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { savePaymentSettings } from "@/lib/actions/admin"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Settings } from "@/lib/types"

export function PaymentSettingsForm({ settings }: { settings: Settings | null }) {
  const [form, setForm] = useState({
    jazzcash_number: settings?.jazzcash_number ?? "",
    jazzcash_name: settings?.jazzcash_name ?? "",
    easypaisa_number: settings?.easypaisa_number ?? "",
    easypaisa_name: settings?.easypaisa_name ?? "",
    referral_bonus_percent: String(settings?.referral_bonus_percent ?? 5),
    min_withdrawal: "0",
    usdt_bsc_address: settings?.usdt_bsc_address ?? "",
    usdt_opbnb_address: settings?.usdt_opbnb_address ?? "",
    usdt_polygon_address: settings?.usdt_polygon_address ?? "",
    usdt_trc20_address: settings?.usdt_trc20_address ?? "",
  })
  const [loading, setLoading] = useState(false)

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await savePaymentSettings({
      jazzcash_number: form.jazzcash_number,
      jazzcash_name: form.jazzcash_name,
      easypaisa_number: form.easypaisa_number,
      easypaisa_name: form.easypaisa_name,
      referral_bonus_percent: Number(form.referral_bonus_percent),
      min_withdrawal: Number(form.min_withdrawal),
      usdt_bsc_address: form.usdt_bsc_address,
      usdt_opbnb_address: form.usdt_opbnb_address,
      usdt_polygon_address: form.usdt_polygon_address,
      usdt_trc20_address: form.usdt_trc20_address,
    })
    setLoading(false)
    if (res.ok) toast.success("Settings saved.")
    else toast.error(res.error ?? "Could not save settings.")
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/60 lg:col-span-2">
        <CardHeader>
          <CardTitle>USDT receiving wallets</CardTitle>
          <CardDescription>Users will see the address for their selected network when depositing.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {([
            ["usdt_bsc_address", "USDT · BSC"],
            ["usdt_opbnb_address", "USDT · opBNB"],
            ["usdt_polygon_address", "USDT · Polygon (POL)"],
            ["usdt_trc20_address", "USDT · TRC20"],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex flex-col gap-2">
              <Label htmlFor={key}>{label} wallet address</Label>
              <Input id={key} value={form[key]} onChange={(e) => update(key, e.target.value)} placeholder="Paste wallet address" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/60 lg:col-span-2">
        <CardHeader>
          <CardTitle>Platform rules</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="ref-pct">Referral bonus (%)</Label>
            <Input
              id="ref-pct"
              type="number"
              value={form.referral_bonus_percent}
              onChange={(e) => update("referral_bonus_percent", e.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="min-wd">Minimum withdrawal (disabled)</Label>
            <Input
              id="min-wd"
              type="number"
              value={form.min_withdrawal}
              onChange={(e) => update("min_withdrawal", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  )
}
