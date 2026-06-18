"use client"

import type React from "react"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { registerUser } from "@/lib/actions/auth"
import { BrandLogo } from "@/components/brand-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

function RegisterForm() {
  const params = useSearchParams()
  const [form, setForm] = useState({
    name: "",
    email: "",
    username: "",
    phone: "",
    country: "Pakistan",
    password: "",
    confirm: "",
    referred_by: params.get("ref") ?? "",
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (form.password !== form.confirm) {
      setError("Passwords do not match.")
      return
    }
    setLoading(true)

    // Create an already-confirmed account via the server (no email verification).
    const { error: signUpError } = await registerUser({
      name: form.name,
      email: form.email,
      username: form.username,
      phone: form.phone,
      country: form.country,
      password: form.password,
      referred_by: form.referred_by || null,
    })
    if (signUpError) {
      setError(signUpError)
      setLoading(false)
      return
    }

    // Sign the new user in immediately.
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Hard navigation so the freshly-set auth cookie is sent with the next request.
    window.location.href = "/dashboard"
  }

  return (
    <Card className="border-border/60">
      <CardContent className="p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start earning daily returns today</p>
        </div>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" required value={form.username} onChange={(e) => update("username", e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="03XXXXXXXXX"
                required
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                required
                value={form.confirm}
                onChange={(e) => update("confirm", e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ref">Referral code (optional)</Label>
            <Input
              id="ref"
              value={form.referred_by}
              onChange={(e) => update("referred_by", e.target.value)}
              placeholder="Enter a friend's code"
            />
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="mt-2 w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <BrandLogo />
        </div>
        <Suspense fallback={<div className="h-64" />}>
          <RegisterForm />
        </Suspense>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </main>
  )
}
