import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import type { Profile, Transaction, Plan, Settings } from "@/lib/types"

export type AdminTransaction = Transaction & {
  user_name?: string
  user_email?: string
}

/** Guards a page so only admins can view it. Returns the admin profile. */
export async function requireAdminProfile(): Promise<Profile> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile) redirect("/login")
  if (profile.role !== "admin") redirect("/dashboard")
  return profile as Profile
}

function withUser(tx: Transaction[], profiles: Profile[]): AdminTransaction[] {
  const map = new Map(profiles.map((p) => [p.id, p]))
  return tx.map((t) => {
    const p = map.get(t.user_id)
    return { ...t, user_name: p?.name || p?.username, user_email: p?.email ?? undefined }
  })
}

export async function getAdminData() {
  const admin = createAdminClient()

  const [{ data: profiles }, { data: transactions }, { data: plans }, { data: settings }, { data: investments }] =
    await Promise.all([
      admin.from("profiles").select("*").order("created_at", { ascending: false }),
      admin.from("transactions").select("*").order("created_at", { ascending: false }),
      admin.from("plans").select("*").order("min_deposit", { ascending: true }),
      admin.from("settings").select("*").eq("id", "global").single(),
      admin.from("investments").select("amount, status"),
    ])

  const allProfiles = (profiles as Profile[]) ?? []
  const allTx = (transactions as Transaction[]) ?? []
  const withUsers = withUser(allTx, allProfiles)

  const users = allProfiles.filter((p) => p.role !== "admin")
  const deposits = withUsers.filter((t) => t.type === "deposit")
  const withdrawals = withUsers.filter((t) => t.type === "withdrawal")

  const totalDeposited = allTx
    .filter((t) => t.type === "deposit" && t.status === "approved")
    .reduce((s, t) => s + Number(t.amount), 0)
  const totalWithdrawn = allTx
    .filter((t) => t.type === "withdrawal" && t.status === "approved")
    .reduce((s, t) => s + Number(t.amount), 0)
  const activeInvested = ((investments as { amount: number; status: string }[]) ?? [])
    .filter((i) => i.status === "active")
    .reduce((s, i) => s + Number(i.amount), 0)

  const stats = {
    totalUsers: users.length,
    pendingDeposits: deposits.filter((d) => d.status === "pending").length,
    pendingWithdrawals: withdrawals.filter((w) => w.status === "pending").length,
    totalDeposited,
    totalWithdrawn,
    activeInvested,
  }

  return {
    users,
    deposits,
    withdrawals,
    allTransactions: withUsers,
    plans: (plans as Plan[]) ?? [],
    settings: (settings as Settings) ?? null,
    stats,
  }
}
