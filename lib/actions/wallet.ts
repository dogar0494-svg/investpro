"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type ActionResult = { ok: boolean; error?: string }

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null }
  return { supabase, user }
}



/**
 * Submit a deposit request. Creates a pending `deposit` transaction with the
 * uploaded proof URL. Admin approval credits the wallet (see admin actions).
 */
export async function submitDeposit(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "Not authenticated." }

  const amount = Number(formData.get("amount"))
  const paymentMethod = String(formData.get("payment_method") || "")
  const accountNumber = String(formData.get("account_number") || "")
  const proofImage = String(formData.get("proof_image") || "")

  if (!amount || amount <= 0) return { ok: false, error: "Enter a valid amount." }
  if (!paymentMethod) return { ok: false, error: "Select a payment method." }
  if (!proofImage) return { ok: false, error: "Upload your payment proof screenshot." }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: "deposit",
    amount,
    status: "pending",
    payment_method: paymentMethod,
    account_number: accountNumber,
    proof_image: proofImage,
    description: `Deposit via ${paymentMethod}`,
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath("/dashboard")
  return { ok: true }
}

/**
 * Submit a withdrawal request. Validates against wallet balance and minimum,
 * immediately reserves (debits) the amount from the wallet, and creates a
 * pending `withdrawal` transaction. If an admin rejects it, the amount is
 * refunded (see admin actions).
 */
export async function submitWithdrawal(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "Not authenticated." }

  const amount = Number(formData.get("amount"))
  const paymentMethod = String(formData.get("payment_method") || "")
  const accountNumber = String(formData.get("account_number") || "")

  if (!amount || amount <= 0) return { ok: false, error: "Enter a valid amount." }
  if (!paymentMethod) return { ok: false, error: "Select a payment method." }
  if (!accountNumber) return { ok: false, error: "Enter your account number." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance, withdrawable_balance, referral_code")
    .eq("id", user.id)
    .single()
  if (!profile) return { ok: false, error: "Profile not found." }

  const withdrawalReferralError = "Withdrawal Unavailable You must have at least one active referral who has made a successful deposit before you can withdraw your earnings."

  const { data: settings } = await supabase.from("settings").select("min_withdrawal").eq("id", "global").single()
  const min = Number(settings?.min_withdrawal ?? 500)
  if (amount < min) return { ok: false, error: `Minimum withdrawal is Rs ${min}.` }
  const withdrawableBalance = Number(profile.wallet_balance) * 0.3
  if (amount > withdrawableBalance) return { ok: false, error: "Insufficient withdrawable balance." }

  const { data: existingPending } = await supabase
    .from("transactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", "withdrawal")
    .eq("status", "pending")
    .limit(1)
    .maybeSingle()
  if (existingPending) return { ok: false, error: "You already have a pending withdrawal request." }

  // Validate referral eligibility before reserving funds or creating a pending request.
  const { data: hasAvailableReferral, error: eligibilityError } = await supabase.rpc("has_available_active_referral")
  if (eligibilityError || !hasAvailableReferral) {
    return { ok: false, error: withdrawalReferralError }
  }

  const feeAmount = Math.round(amount * 0.2 * 100) / 100
  const netAmount = Math.round((amount - feeAmount) * 100) / 100

  // Reserve the gross request amount; the user receives 80% after the fee.
  const { error: atomicError } = await supabase.rpc("submit_withdrawal_atomic", {
    p_user_id: user.id,
    p_amount: amount,
    p_payment_method: paymentMethod,
    p_account_number: accountNumber,
    p_fee_amount: feeAmount,
    p_net_amount: netAmount,
    p_withdrawal_date: new Date().toISOString().slice(0, 10),
  })
  if (atomicError) {
    const message = atomicError.message.includes("pending") || atomicError.message.includes("referral")
      ? withdrawalReferralError
      : atomicError.message
    return { ok: false, error: message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/admin")
  return { ok: true }
}

/**
 * Invest from wallet balance into a plan. Debits the wallet immediately,
 * creates an active investment with computed end date, increments
 * total_invested, and records an `investment` transaction.
 */
export async function investInPlan(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await requireUser()
  if (!user) return { ok: false, error: "Not authenticated." }

  const planId = String(formData.get("plan_id") || "")
  const amount = Number(formData.get("amount"))

  const { data: plan } = await supabase.from("plans").select("*").eq("id", planId).single()
  if (!plan) return { ok: false, error: "Plan not found." }

  if (!amount || amount < Number(plan.min_deposit) || amount > Number(plan.max_deposit)) {
    return {
      ok: false,
      error: `Amount must be between Rs ${plan.min_deposit} and Rs ${plan.max_deposit}.`,
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance, total_invested")
    .eq("id", user.id)
    .single()
  if (!profile) return { ok: false, error: "Profile not found." }
  if (amount > Number(profile.wallet_balance)) return { ok: false, error: "Insufficient wallet balance." }

  const now = new Date()
  const end = new Date(now.getTime() + Number(plan.duration_days) * 24 * 60 * 60 * 1000)

  const { error: invErr } = await supabase.from("investments").insert({
    user_id: user.id,
    plan_id: plan.id,
    plan_name: plan.name,
    plan_daily_profit: plan.daily_profit,
    plan_duration_days: plan.duration_days,
    plan_total_return: plan.total_return,
    amount,
    start_date: now.toISOString(),
    end_date: end.toISOString(),
    last_processed: now.toISOString(),
    status: "active",
    profit_earned: 0,
  })
  if (invErr) return { ok: false, error: invErr.message }

  await supabase
    .from("profiles")
    .update({
      wallet_balance: Number(profile.wallet_balance) - amount,
      total_invested: Number(profile.total_invested) + amount,
    })
    .eq("id", user.id)

  await supabase.from("transactions").insert({
    user_id: user.id,
    type: "investment",
    amount,
    status: "completed",
    plan_id: plan.id,
    description: `Invested in ${plan.name}`,
  })

  revalidatePath("/dashboard")
  revalidatePath("/plans")
  return { ok: true }
}
