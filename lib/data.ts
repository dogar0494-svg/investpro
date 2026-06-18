import { createClient } from "@/lib/supabase/server"
import { accrueProfits } from "@/lib/profit"
import type { Profile, Plan, Transaction, Investment, Settings } from "@/lib/types"
import { redirect } from "next/navigation"

/**
 * Loads the current authenticated user's profile after running server-side
 * profit accrual. Redirects to /login if there is no session. Used by every
 * protected page so balances are always up to date on load.
 */
export async function getCurrentUser(): Promise<{ profile: Profile }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Accrue any owed profit before reading balances.
  await accrueProfits(supabase, user.id)

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) redirect("/login")
  if (profile.is_blocked) redirect("/blocked")

  return { profile: profile as Profile }
}

export async function getPlans(): Promise<Plan[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("plans").select("*").order("min_deposit", { ascending: true })
  return (data as Plan[]) ?? []
}

export async function getSettings(): Promise<Settings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("settings").select("*").eq("id", "global").single()
  return (data as Settings) ?? null
}

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return (data as Transaction[]) ?? []
}

export async function getInvestments(userId: string): Promise<Investment[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("investments")
    .select("*")
    .eq("user_id", userId)
    .order("start_date", { ascending: false })
  return (data as Investment[]) ?? []
}

export async function getReferrals(referralCode: string): Promise<Profile[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("*").eq("referred_by", referralCode)
  return (data as Profile[]) ?? []
}
