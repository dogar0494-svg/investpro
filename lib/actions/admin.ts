"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

type ActionResult = { ok: boolean; error?: string }

/** Verifies the caller is an authenticated admin. Returns a service-role client. */
async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { admin: null, error: "Not authenticated." as const }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || profile.role !== "admin") return { admin: null, user: null, error: "Not authorized." as const }

  return { admin: createAdminClient(), user, error: null }
}

/** Approve a pending deposit: credit wallet, pay referral bonus on first deposit. */
export async function approveDeposit(txId: string): Promise<ActionResult> {
  const { admin, error } = await requireAdmin()
  if (!admin) return { ok: false, error }

  const { data: tx } = await admin.from("transactions").select("*").eq("id", txId).single()
  if (!tx || tx.type !== "deposit") return { ok: false, error: "Deposit not found." }
  if (tx.status !== "pending") return { ok: false, error: "Already processed." }

  const { data: profile } = await admin
    .from("profiles")
    .select("wallet_balance, referred_by")
    .eq("id", tx.user_id)
    .single()
  if (!profile) return { ok: false, error: "User not found." }

  // Credit the wallet.
  await admin
    .from("profiles")
    .update({ wallet_balance: Number(profile.wallet_balance) + Number(tx.amount) })
    .eq("id", tx.user_id)

  await admin.from("transactions").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", txId)

  // Credit one-time, duplicate-safe commissions for the first approved deposit.
  const { count: approvedDeposits } = await admin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", tx.user_id)
    .eq("type", "deposit")
    .eq("status", "approved")
  if ((approvedDeposits ?? 0) === 1) {
    const { data: settings } = await admin.from("settings").select("referral_bonus_percent").eq("id", "global").single()
    const baseRate = Number(settings?.referral_bonus_percent ?? 5)
    const rates = [baseRate, baseRate / 2, baseRate / 4]
    let referredBy = profile.referred_by

    for (let level = 1; level <= 3 && referredBy; level += 1) {
      const { data: referrer } = await admin
        .from("profiles")
        .select("id, wallet_balance, total_profit, referral_earnings, referral_code, referred_by")
        .eq("referral_code", referredBy)
        .maybeSingle()
      if (!referrer) break

      const rate = rates[level - 1]
      const commission = (Number(tx.amount) * rate) / 100
      if (commission > 0) {
        const { data: inserted } = await admin.from("referral_commissions").insert({
          user_id: referrer.id,
          source_user_id: tx.user_id,
          source_transaction_id: tx.id,
          level,
          rate,
          amount: commission,
        }).select("id").maybeSingle()

        if (inserted) {
          await admin.from("profiles").update({
            wallet_balance: Number(referrer.wallet_balance) + commission,
            total_profit: Number(referrer.total_profit) + commission,
            referral_earnings: Number(referrer.referral_earnings ?? 0) + commission,
          }).eq("id", referrer.id)
          await admin.from("transactions").insert({
            user_id: referrer.id,
            type: "referral",
            amount: commission,
            status: "completed",
            referred_user_id: tx.user_id,
            description: `Level ${level} referral commission (${rate}%)`,
          })
        }
      }
      referredBy = referrer.referred_by
    }
  }

  revalidatePath("/admin")
  return { ok: true }
}

/** Reject a pending deposit (no funds were moved). */
export async function rejectDeposit(txId: string): Promise<ActionResult> {
  const { admin, error } = await requireAdmin()
  if (!admin) return { ok: false, error }

  const { data: tx } = await admin.from("transactions").select("status, type").eq("id", txId).single()
  if (!tx || tx.type !== "deposit") return { ok: false, error: "Deposit not found." }
  if (tx.status !== "pending") return { ok: false, error: "Already processed." }

  await admin.from("transactions").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", txId)
  revalidatePath("/admin")
  return { ok: true }
}

/** Approve a pending withdrawal (funds already reserved at request time). */
export async function approveWithdrawal(txId: string): Promise<ActionResult> {
  const { admin, error } = await requireAdmin()
  if (!admin) return { ok: false, error }

  const { data: tx } = await admin.from("transactions").select("status, type").eq("id", txId).single()
  if (!tx || tx.type !== "withdrawal") return { ok: false, error: "Withdrawal not found." }
  if (tx.status !== "pending") return { ok: false, error: "Already processed." }

  await admin.from("transactions").update({ status: "approved", updated_at: new Date().toISOString() }).eq("id", txId)
  revalidatePath("/admin")
  return { ok: true }
}

/** Reject a pending withdrawal: refund the reserved amount to the wallet. */
export async function rejectWithdrawal(txId: string): Promise<ActionResult> {
  const { admin, error } = await requireAdmin()
  if (!admin) return { ok: false, error }

  const { data: tx } = await admin.from("transactions").select("*").eq("id", txId).single()
  if (!tx || tx.type !== "withdrawal") return { ok: false, error: "Withdrawal not found." }
  if (tx.status !== "pending") return { ok: false, error: "Already processed." }

  const { data: profile } = await admin.from("profiles").select("wallet_balance").eq("id", tx.user_id).single()
  if (profile) {
    await admin
      .from("profiles")
      .update({ wallet_balance: Number(profile.wallet_balance) + Number(tx.amount) })
      .eq("id", tx.user_id)
  }
  await admin.from("transactions").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", txId)
  revalidatePath("/admin")
  return { ok: true }
}

/** Block or unblock a user. */
const impersonationCookie = "investpro_admin_impersonation"

export async function startImpersonation(userId: string): Promise<ActionResult> {
  const { admin, user, error } = await requireAdmin()
  if (!admin || !user) return { ok: false, error }
  if (!userId) return { ok: false, error: "User is required." }

  const { data: target } = await admin.from("profiles").select("id, role, is_blocked").eq("id", userId).single()
  if (!target || target.role === "admin") return { ok: false, error: "Only active user accounts can be impersonated." }
  if (target.is_blocked) return { ok: false, error: "Blocked accounts cannot be impersonated." }

  const store = await cookies()
  store.set(impersonationCookie, JSON.stringify({ adminId: user.id, targetId: userId, createdAt: Date.now() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  })
  await admin.from("admin_impersonation_audit").insert({ admin_user_id: user.id, target_user_id: userId, action: "start" })
  return { ok: true }
}

export async function stopImpersonation(): Promise<ActionResult> {
  const store = await cookies()
  store.delete(impersonationCookie)
  return { ok: true }
}

export async function setUserBlocked(userId: string, blocked: boolean): Promise<ActionResult> {
  const { admin, error } = await requireAdmin()
  if (!admin) return { ok: false, error }
  await admin.from("profiles").update({ is_blocked: blocked }).eq("id", userId)
  revalidatePath("/admin")
  return { ok: true }
}

/** Manually adjust a user's wallet balance (admin credit/debit). Only updates wallet_balance field. */
export async function adjustBalance(userId: string, delta: number): Promise<ActionResult> {
  const { admin, error } = await requireAdmin()
  if (!admin) return { ok: false, error }
  if (!delta || Number.isNaN(delta)) return { ok: false, error: "Enter a valid amount." }

  const { data: profile } = await admin.from("profiles").select("wallet_balance").eq("id", userId).single()
  if (!profile) return { ok: false, error: "User not found." }
  const next = Number(profile.wallet_balance) + delta
  if (next < 0) return { ok: false, error: "Balance cannot go negative." }

  // Only update wallet_balance; all other fields remain unchanged.
  await admin.from("profiles").update({ wallet_balance: next }).eq("id", userId)
  await admin.from("transactions").insert({
    user_id: userId,
    type: "adjustment",
    amount: Math.abs(delta),
    status: "completed",
    description: delta >= 0 ? "Admin credit" : "Admin debit",
  })
  revalidatePath("/admin")
  return { ok: true }
}

/** Save platform payment + referral settings. */
export async function savePaymentSettings(formData: {
  jazzcash_number: string
  jazzcash_name: string
  easypaisa_number: string
  easypaisa_name: string
  referral_bonus_percent: number
  min_withdrawal: number
}): Promise<ActionResult> {
  const { admin, error } = await requireAdmin()
  if (!admin) return { ok: false, error }

  await admin
    .from("settings")
    .update({
      jazzcash_number: formData.jazzcash_number,
      jazzcash_name: formData.jazzcash_name,
      easypaisa_number: formData.easypaisa_number,
      easypaisa_name: formData.easypaisa_name,
      referral_bonus_percent: formData.referral_bonus_percent,
      min_withdrawal: formData.min_withdrawal,
    })
    .eq("id", "global")
  revalidatePath("/admin")
  return { ok: true }
}

/** Create or update an investment plan. */
export async function savePlan(formData: {
  id: string
  name: string
  icon: string
  min_deposit: number
  max_deposit: number
  daily_profit: number
  duration_days: number
  total_return: number
  color: string
  featured: boolean
}): Promise<ActionResult> {
  const { admin, error } = await requireAdmin()
  if (!admin) return { ok: false, error }
  if (!formData.id || !formData.name) return { ok: false, error: "Plan id and name are required." }

  const { error: upErr } = await admin.from("plans").upsert({
    id: formData.id.trim().toLowerCase(),
    name: formData.name,
    icon: formData.icon || "fa-chart-line",
    min_deposit: formData.min_deposit,
    max_deposit: formData.max_deposit,
    daily_profit: formData.daily_profit,
    duration_days: formData.duration_days,
    total_return: formData.total_return,
    color: formData.color || "#6c63ff",
    featured: formData.featured,
  })
  if (upErr) return { ok: false, error: upErr.message }
  revalidatePath("/admin")
  revalidatePath("/plans")
  return { ok: true }
}

/** Delete an investment plan. */
export async function deletePlan(planId: string): Promise<ActionResult> {
  const { admin, error } = await requireAdmin()
  if (!admin) return { ok: false, error }
  await admin.from("plans").delete().eq("id", planId)
  revalidatePath("/admin")
  revalidatePath("/plans")
  return { ok: true }
}
