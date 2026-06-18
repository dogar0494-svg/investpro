"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/format"
import type { Plan, Settings } from "@/lib/types"
import type { AdminTransaction } from "@/lib/admin-data"
import type { Profile } from "@/lib/types"
import {
  approveDeposit,
  rejectDeposit,
  approveWithdrawal,
  rejectWithdrawal,
  setUserBlocked,
  adjustBalance,
} from "@/lib/actions/admin"
import { PaymentSettingsForm } from "./payment-settings-form"
import { PlansManager } from "./plans-manager"
import { ProofDialog } from "./proof-dialog"

type Stats = {
  totalUsers: number
  pendingDeposits: number
  pendingWithdrawals: number
  totalDeposited: number
  totalWithdrawn: number
  activeInvested: number
}

function statusTone(status: string) {
  if (status === "pending") return "bg-warning/15 text-warning"
  if (status === "approved" || status === "completed") return "bg-success/15 text-success"
  if (status === "rejected") return "bg-destructive/15 text-destructive"
  return "bg-muted text-muted-foreground"
}

export function AdminPanel({
  users,
  deposits,
  withdrawals,
  allTransactions,
  plans,
  settings,
  stats,
}: {
  users: Profile[]
  deposits: AdminTransaction[]
  withdrawals: AdminTransaction[]
  allTransactions: AdminTransaction[]
  plans: Plan[]
  settings: Settings | null
  stats: Stats
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    startTransition(async () => {
      const res = await fn()
      if (res.ok) {
        toast.success(successMsg)
        router.refresh()
      } else {
        toast.error(res.error ?? "Action failed.")
      }
    })
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: "fa-users", isCurrency: false },
    { label: "Pending Deposits", value: stats.pendingDeposits, icon: "fa-arrow-down", isCurrency: false },
    { label: "Pending Withdrawals", value: stats.pendingWithdrawals, icon: "fa-arrow-up", isCurrency: false },
    { label: "Total Deposited", value: stats.totalDeposited, icon: "fa-sack-dollar", isCurrency: true },
    { label: "Total Withdrawn", value: stats.totalWithdrawn, icon: "fa-money-bill-transfer", isCurrency: true },
    { label: "Active Invested", value: stats.activeInvested, icon: "fa-chart-line", isCurrency: true },
  ]

  const pendingDeposits = deposits.filter((d) => d.status === "pending")
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending")

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="deposits">
          Deposits {pendingDeposits.length > 0 && <Badge className="ml-1.5 bg-warning text-warning-foreground">{pendingDeposits.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="withdrawals">
          Withdrawals {pendingWithdrawals.length > 0 && <Badge className="ml-1.5 bg-warning text-warning-foreground">{pendingWithdrawals.length}</Badge>}
        </TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="plans">Plans</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      {/* OVERVIEW */}
      <TabsContent value="overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((s) => (
            <Card key={s.label} className="border-border/60">
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/15 text-primary">
                  <i className={`fa-solid ${s.icon} text-lg`} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.isCurrency ? formatCurrency(s.value) : s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <h3 className="mb-3 mt-8 text-lg font-semibold">Recent activity</h3>
        <Card className="border-border/60">
          <CardContent className="p-0">
            <TxTable rows={allTransactions.slice(0, 12)} />
          </CardContent>
        </Card>
      </TabsContent>

      {/* DEPOSITS */}
      <TabsContent value="deposits">
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Proof</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No deposits yet.
                      </td>
                    </tr>
                  )}
                  {deposits.map((d) => (
                    <tr key={d.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{d.user_name}</div>
                        <div className="text-xs text-muted-foreground">{d.user_email}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(d.amount)}</td>
                      <td className="px-4 py-3 capitalize">{d.payment_method}</td>
                      <td className="px-4 py-3">{d.proof_image ? <ProofDialog url={d.proof_image} /> : "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusTone(d.status)}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {d.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() => run(() => approveDeposit(d.id), "Deposit approved.")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => run(() => rejectDeposit(d.id), "Deposit rejected.")}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* WITHDRAWALS */}
      <TabsContent value="withdrawals">
        <Card className="border-border/60">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Account</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                        No withdrawals yet.
                      </td>
                    </tr>
                  )}
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{w.user_name}</div>
                        <div className="text-xs text-muted-foreground">{w.user_email}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(w.amount)}</td>
                      <td className="px-4 py-3 capitalize">{w.payment_method}</td>
                      <td className="px-4 py-3 font-mono text-xs">{w.account_number}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusTone(w.status)}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {w.status === "pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={pending}
                              onClick={() => run(() => approveWithdrawal(w.id), "Withdrawal approved.")}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={pending}
                              onClick={() => run(() => rejectWithdrawal(w.id), "Withdrawal rejected & refunded.")}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* USERS */}
      <TabsContent value="users">
        <UsersTable users={users} pending={pending} run={run} />
      </TabsContent>

      {/* PLANS */}
      <TabsContent value="plans">
        <PlansManager plans={plans} />
      </TabsContent>

      {/* SETTINGS */}
      <TabsContent value="settings">
        <PaymentSettingsForm settings={settings} />
      </TabsContent>
    </Tabs>
  )
}

function TxTable({ rows }: { rows: AdminTransaction[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">User</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                No activity yet.
              </td>
            </tr>
          )}
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-border/50 last:border-0">
              <td className="px-4 py-3">{t.user_name}</td>
              <td className="px-4 py-3 capitalize">{t.type}</td>
              <td className="px-4 py-3 font-semibold">{formatCurrency(t.amount)}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusTone(t.status)}`}>{t.status}</span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function UsersTable({
  users,
  pending,
  run,
}: {
  users: Profile[]
  pending: boolean
  run: (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) => void
}) {
  const [adjusting, setAdjusting] = useState<string | null>(null)
  const [amount, setAmount] = useState("")

  return (
    <Card className="border-border/60">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Balance</th>
                <th className="px-4 py-3 font-medium">Invested</th>
                <th className="px-4 py-3 font-medium">Referral</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No users yet.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.name || u.username}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(u.wallet_balance)}</td>
                  <td className="px-4 py-3">{formatCurrency(u.total_invested)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{u.referral_code}</td>
                  <td className="px-4 py-3">
                    {u.is_blocked ? (
                      <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">Blocked</span>
                    ) : (
                      <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => run(() => setUserBlocked(u.id, !u.is_blocked), u.is_blocked ? "User unblocked." : "User blocked.")}
                        >
                          {u.is_blocked ? "Unblock" : "Block"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAdjusting(adjusting === u.id ? null : u.id)
                            setAmount("")
                          }}
                        >
                          Adjust
                        </Button>
                      </div>
                      {adjusting === u.id && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="+/- amount"
                            className="h-8 w-28 rounded-md border border-input bg-background px-2 text-sm"
                          />
                          <Button
                            size="sm"
                            disabled={pending || !amount}
                            onClick={() =>
                              run(() => adjustBalance(u.id, Number(amount)), "Balance adjusted.")
                            }
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
