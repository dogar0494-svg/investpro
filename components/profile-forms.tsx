"use client"

import type React from "react"
import { useState } from "react"
import { toast } from "sonner"
import { updateProfile, changePassword } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Profile } from "@/lib/types"

export function ProfileDetailsForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState({
    name: profile.name ?? "",
    username: profile.username ?? "",
    phone: profile.phone ?? "",
    country: profile.country ?? "Pakistan",
  })
  const [loading, setLoading] = useState(false)

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await updateProfile(form)
    setLoading(false)
    if (res.ok) toast.success("Profile updated.")
    else toast.error(res.error ?? "Could not update profile.")
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={form.username} onChange={(e) => update("username", e.target.value)} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="country">Country</Label>
        <Input id="country" value={form.country} onChange={(e) => update("country", e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email-readonly">Email</Label>
        <Input id="email-readonly" value={profile.email ?? ""} disabled />
      </div>
      <Button type="submit" disabled={loading} className="mt-2 self-start">
        {loading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}

export function PasswordForm() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error("Passwords do not match.")
      return
    }
    setLoading(true)
    const res = await changePassword(password)
    setLoading(false)
    if (res.ok) {
      toast.success("Password changed.")
      setPassword("")
      setConfirm("")
    } else {
      toast.error(res.error ?? "Could not change password.")
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-password">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={loading} className="mt-2 self-start">
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  )
}

export function ReferralCodeCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const link = `${window.location.origin}/register?ref=${code}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast.success("Referral link copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Could not copy link.")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-lg border border-dashed border-primary/40 bg-primary/5 px-4 py-3">
        <span className="font-mono text-lg font-bold tracking-widest text-primary">{code}</span>
        <Button size="sm" variant="outline" onClick={copy} type="button">
          <i className={`fa-solid ${copied ? "fa-check" : "fa-copy"} mr-2`} aria-hidden="true" />
          {copied ? "Copied" : "Copy link"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Share your link and earn a referral bonus when friends make their first deposit.
      </p>
    </div>
  )
}
