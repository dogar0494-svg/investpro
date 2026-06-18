"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function ProofDialog({ url }: { url: string }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button size="sm" variant="ghost">
            <i className="fa-solid fa-image mr-1.5" aria-hidden="true" /> View
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Payment proof</DialogTitle>
        </DialogHeader>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url || "/placeholder.svg"} alt="Payment proof screenshot" className="w-full rounded-lg border border-border" />
      </DialogContent>
    </Dialog>
  )
}
