"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { savePlan, deletePlan } from "@/lib/actions/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/format"
import type { Plan } from "@/lib/types"

const EMPTY = {
  id: "",
  name: "",
  icon: "fa-chart-line",
  min_deposit: "",
  max_deposit: "",
  daily_profit: "",
  duration_days: "",
  total_return: "",
  color: "#6c63ff",
  featured: false,
}

export function PlansManager({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<typeof EMPTY>(EMPTY)
  const [editing, setEditing] = useState(false)

  function openCreate() {
    setForm(EMPTY)
    setEditing(false)
    setOpen(true)
  }

  function openEdit(p: Plan) {
    setForm({
      id: p.id,
      name: p.name,
      icon: p.icon,
      min_deposit: String(p.min_deposit),
      max_deposit: String(p.max_deposit),
      daily_profit: String(p.daily_profit),
      duration_days: String(p.duration_days),
      total_return: String(p.total_return),
      color: p.color,
      featured: p.featured,
    })
    setEditing(true)
    setOpen(true)
  }

  function update(key: keyof typeof EMPTY, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await savePlan({
        id: form.id,
        name: form.name,
        icon: form.icon,
        min_deposit: Number(form.min_deposit),
        max_deposit: Number(form.max_deposit),
        daily_profit: Number(form.daily_profit),
        duration_days: Number(form.duration_days),
        total_return: Number(form.total_return),
        color: form.color,
        featured: form.featured,
      })
      if (res.ok) {
        toast.success(editing ? "Plan updated." : "Plan created.")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.error ?? "Could not save plan.")
      }
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deletePlan(id)
      if (res.ok) {
        toast.success("Plan deleted.")
        router.refresh()
      } else {
        toast.error(res.error ?? "Could not delete plan.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <i className="fa-solid fa-plus mr-2" aria-hidden="true" /> New plan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <Card key={p.id} className="border-border/60">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: p.color }}
                >
                  <i className={`fa-solid ${p.icon}`} aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.daily_profit}% daily · {p.duration_days} days
                  </p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(p.min_deposit)} – {formatCurrency(p.max_deposit)}
              </div>
              <div className="mt-1 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => remove(p.id)}>
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className="hidden" />
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit plan" : "Create plan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="p-id">Plan ID</Label>
                <Input id="p-id" value={form.id} onChange={(e) => update("id", e.target.value)} disabled={editing} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="p-name">Name</Label>
                <Input id="p-name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="p-min">Min deposit</Label>
                <Input id="p-min" type="number" value={form.min_deposit} onChange={(e) => update("min_deposit", e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="p-max">Max deposit</Label>
                <Input id="p-max" type="number" value={form.max_deposit} onChange={(e) => update("max_deposit", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="p-daily">Daily %</Label>
                <Input id="p-daily" type="number" step="0.1" value={form.daily_profit} onChange={(e) => update("daily_profit", e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="p-dur">Days</Label>
                <Input id="p-dur" type="number" value={form.duration_days} onChange={(e) => update("duration_days", e.target.value)} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="p-total">Total %</Label>
                <Input id="p-total" type="number" value={form.total_return} onChange={(e) => update("total_return", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="p-icon">Icon class</Label>
                <Input id="p-icon" value={form.icon} onChange={(e) => update("icon", e.target.value)} placeholder="fa-crown" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="p-color">Color</Label>
                <Input id="p-color" type="color" value={form.color} onChange={(e) => update("color", e.target.value)} className="h-10 p-1" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
              Mark as featured
            </label>
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : editing ? "Update plan" : "Create plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
