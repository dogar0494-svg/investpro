import type { SupabaseClient } from "@supabase/supabase-js"
import type { Investment } from "@/lib/types"

const DAY_MS = 1000 * 60 * 60 * 24

/**
 * Server-side profit accrual. For every active investment owned by `userId`,
 * credit profit for each WHOLE day elapsed since `last_processed`, capped at the
 * investment's `end_date`. Updates the investment rows, the user's profile
 * balances, and writes a `profit` transaction for the credited amount.
 *
 * This is idempotent across loads: only whole, not-yet-credited days are paid,
 * and `last_processed` is advanced by exactly that many days. It does not rely
 * on an open browser tab and cannot be tampered with from the client.
 */
export async function accrueProfits(supabase: SupabaseClient, userId: string): Promise<void> {
  const { data: investments } = await supabase
    .from("investments")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")

  if (!investments || investments.length === 0) return

  const now = Date.now()
  let totalCredited = 0

  for (const inv of investments as Investment[]) {
    const end = new Date(inv.end_date).getTime()
    const lastProcessed = new Date(inv.last_processed).getTime()
    const effectiveNow = Math.min(now, end)

    const daysElapsed = Math.floor((effectiveNow - lastProcessed) / DAY_MS)
    const isFinished = now >= end

    if (daysElapsed <= 0 && !isFinished) continue

    const dailyAmount = (Number(inv.amount) * Number(inv.plan_daily_profit)) / 100
    const credit = dailyAmount * Math.max(0, daysElapsed)

    const newProfitEarned = Number(inv.profit_earned) + credit
    const newLastProcessed = new Date(lastProcessed + daysElapsed * DAY_MS).toISOString()

    await supabase
      .from("investments")
      .update({
        profit_earned: newProfitEarned,
        last_processed: isFinished ? inv.end_date : newLastProcessed,
        status: isFinished ? "completed" : "active",
      })
      .eq("id", inv.id)

    if (credit > 0) {
      totalCredited += credit
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "profit",
        amount: credit,
        status: "completed",
        plan_id: inv.plan_id,
        description: `Daily profit from ${inv.plan_name} (${daysElapsed} day${daysElapsed > 1 ? "s" : ""})`,
      })
    }
  }

  if (totalCredited > 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance, total_profit")
      .eq("id", userId)
      .single()

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          wallet_balance: Number(profile.wallet_balance) + totalCredited,
          total_profit: Number(profile.total_profit) + totalCredited,
        })
        .eq("id", userId)
    }
  }
}
