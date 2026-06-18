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
    min_withdrawal: String(settings?.min_withdrawal ?? 500),
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
    })
    setLoading(false)
    if (res.ok) toast.success("Settings saved.")
    else toast.error(res.error ?? "Could not save settings.")
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>JazzCash</CardTitle>
          <CardDescription>Account users send deposits to.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="jc-num">Account number</Label>
            <Input id="jc-num" value={form.jazzcash_number} onChange={(e) => update("jazzcash_number", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="jc-name">Account name</Label>
            <Input id="jc-name" value={form.jazzcash_name} onChange={(e) => update("jazzcash_name", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>EasyPaisa</CardTitle>
          <CardDescription>Account users send deposits to.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="ep-num">Account number</Label>
            <Input id="ep-num" value={form.easypaisa_number} onChange={(e) => update("easypaisa_number", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ep-name">Account name</Label>
            <Input id="ep-name" value={form.easypaisa_name} onChange={(e) => update("easypaisa_name", e.target.value)} />
          </div>
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
            <Label htmlFor="min-wd">Minimum withdrawal (Rs)</Label>
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
