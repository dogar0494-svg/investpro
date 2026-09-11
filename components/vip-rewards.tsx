import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

type Reward = {
  tier: string
  referrals_required: number
  reward_amount: number
  status: string
}

const tiers = [
  { key: "bronze", label: "Bronze", referrals: 5, reward: 1000, detail: "Withdrawal in 24 hours", tone: "bg-orange-100 border-orange-200" },
  { key: "silver", label: "Silver", referrals: 15, reward: 3000, detail: "Withdrawal in 12 hours", tone: "bg-slate-100 border-slate-200" },
  { key: "gold", label: "Gold", referrals: 30, reward: 7000, detail: "6 hours + 1% extra commission", tone: "bg-amber-100 border-amber-200" },
  { key: "platinum", label: "Platinum", referrals: 50, reward: 15000, detail: "2 hours + 2% extra commission", tone: "bg-sky-100 border-sky-200" },
  { key: "diamond", label: "Diamond", referrals: 100, reward: 350000, detail: "Priority support + 3% extra commission", tone: "bg-fuchsia-100 border-fuchsia-200" },
]

export function VipRewards({ activeCount, rewards }: { activeCount: number; rewards: Reward[] }) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">VIP program rewards</CardTitle>
        <p className="text-sm text-muted-foreground">Build active referrals to unlock milestone rewards.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {tiers.map((tier) => {
          const unlocked = activeCount >= tier.referrals
          const claim = rewards.find((reward) => reward.tier === tier.key)
          return (
            <div key={tier.key} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${tier.tone}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-background/75 text-sm font-bold text-foreground">{tier.referrals}</span>
                <div>
                  <p className="font-semibold text-foreground">{tier.label}</p>
                  <p className="text-xs text-foreground/70">{tier.referrals} active referrals · {tier.detail}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-foreground">{formatCurrency(tier.reward)}</p>
                <p className="text-[11px] font-medium text-foreground/60">{unlocked || claim ? "Unlocked" : `${Math.max(0, tier.referrals - activeCount)} to go`}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
