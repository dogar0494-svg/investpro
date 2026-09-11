import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { Profile } from "@/lib/types"

export function ReferralOverview({ referrals, earnings }: { referrals: Profile[]; earnings: number }) {
  const active = referrals.filter((referral) => referral.id)
  const bonusUnlocked = active.length >= 100

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">Referral network</CardTitle>
          <p className="text-sm text-muted-foreground">Level 1 referrals with approved deposits unlock withdrawals.</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{active.length} active</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Referral earnings</span>
          <span className="font-semibold">{formatCurrency(earnings)}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <span className="text-muted-foreground">100-referral bonus</span>
          <span className={bonusUnlocked ? "font-semibold text-primary" : "font-medium"}>
            {bonusUnlocked ? "$100,000 unlocked for admin review" : `${active.length}/100 active referrals`}
          </span>
        </div>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Share your referral code to build your network.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {referrals.slice(0, 5).map((referral) => (
              <div key={referral.id} className="flex items-center justify-between border-b border-border/50 pb-2 text-sm last:border-0 last:pb-0">
                <span>{referral.name || referral.username || "Investor"}</span>
                <span className="text-muted-foreground">Joined {new Date(referral.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
