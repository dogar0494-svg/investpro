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

export async function getVipRewards(userId: string) {
  const supabase = await createClient()
  await supabase.rpc("sync_vip_rewards", { p_user_id: userId })
  const { data } = await supabase
    .from("vip_reward_claims")
    .select("tier, referrals_required, reward_amount, status")
    .eq("user_id", userId)
    .order("referrals_required", { ascending: true })
  return data ?? []
}

export async function getActiveReferralCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const { data } = await supabase.rpc("referral_active_level1_count", { p_user_id: userId })
  return Number(data ?? 0)
}

export async function getTeam(userId: string, referralCode: string) {
  const supabase = await createClient()
  const { data: level1 } = await supabase
    .from("profiles")
    .select("id, username, name, referral_code, referred_by, created_at")
    .eq("referred_by", referralCode)
  const level1Rows = level1 ?? []
  const level1Codes = level1Rows.map((member) => member.referral_code).filter(Boolean)
  const { data: level2 } = level1Codes.length
    ? await supabase.from("profiles").select("id, username, name, referral_code, referred_by, created_at").in("referred_by", level1Codes)
    : { data: [] }
  const level2Rows = level2 ?? []
  const level2Codes = level2Rows.map((member) => member.referral_code).filter(Boolean)
  const { data: level3 } = level2Codes.length
    ? await supabase.from("profiles").select("id, username, name, referral_code, referred_by, created_at").in("referred_by", level2Codes)
    : { data: [] }
  return { level1, level2: level2Rows, level3: level3 ?? [] }
}
