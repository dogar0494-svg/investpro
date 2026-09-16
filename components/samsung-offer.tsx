"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const ELIGIBLE_USERS = new Set([
  "d4524d94-d974-4ab5-865b-7c79e1796f26",
  "23ce307d-43fb-4f81-a7d4-b22f2857f10",
])

export function SamsungOffer({ userId, activeReferrals }: { userId: string; activeReferrals: number }) {
  const [open, setOpen] = useState(false)
  if (!ELIGIBLE_USERS.has(userId)) return null

  return (
    <>
      <Card className="mb-6 overflow-hidden border-primary/30 bg-gradient-to-r from-primary/15 via-card to-accent/10">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Private member offer</p>
            <h2 className="mt-1 text-xl font-extrabold">Earn a Samsung mobile free</h2>
            <p className="mt-1 text-sm text-muted-foreground">Reach 20 active referrals to qualify for this company reward.</p>
            <p className="mt-3 text-sm font-semibold text-primary">{Math.min(activeReferrals, 20)}/20 active referrals</p>
          </div>
          <Button type="button" onClick={() => setOpen(true)}>View offer</Button>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Samsung mobile reward</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>This exclusive offer is available only on this account.</p>
            <p>Complete 20 active Level 1 referrals with approved deposits to qualify for one Samsung mobile from the company.</p>
            <p className="font-semibold text-foreground">Current progress: {Math.min(activeReferrals, 20)}/20</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
