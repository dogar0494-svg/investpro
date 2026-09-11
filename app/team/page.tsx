import { AppNav } from "@/components/app-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser, getTeam } from "@/lib/data"

export default async function TeamPage() {
  const { profile } = await getCurrentUser()
  const team = await getTeam(profile.id, profile.referral_code ?? "")
  const referralLink = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/register?ref=${profile.referral_code ?? ""}`
  const levels = [
    { label: "Level 1", members: team.level1 ?? [], color: "bg-primary/10 text-primary" },
    { label: "Level 2", members: team.level2 ?? [], color: "bg-accent/20 text-accent-foreground" },
    { label: "Level 3", members: team.level3 ?? [], color: "bg-muted text-foreground" },
  ]

  return (
    <div className="min-h-dvh bg-background pb-24 md:pb-0">
      <AppNav isAdmin={profile.role === "admin"} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">My network</p>
          <h1 className="mt-2 text-3xl font-bold">Team</h1>
          <p className="mt-2 text-muted-foreground">Share your referral link and track your three-level team.</p>
        </div>

        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader><CardTitle className="text-lg">Your referral link</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2 text-sm">{referralLink}</code>
            <Button nativeButton={false} render={<a href={`mailto:?subject=Join my team&body=${encodeURIComponent(referralLink)}`}>Share link</a>}>
              <i className="fa-solid fa-share-nodes mr-2" aria-hidden="true" /> Share
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-5 lg:grid-cols-3">
          {levels.map((level) => (
            <Card key={level.label} className="border-border/70">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{level.label}</CardTitle>
                <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${level.color}`}>{level.members.length}</span>
              </CardHeader>
              <CardContent>
                {level.members.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">No team members yet.</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {level.members.map((member) => (
                      <li key={member.id} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-primary"><i className="fa-solid fa-user" aria-hidden="true" /></span>
                        <div className="min-w-0"><p className="truncate font-medium">{member.username || member.name || "Member"}</p><p className="text-xs text-muted-foreground">Joined {new Date(member.created_at).toLocaleDateString()}</p></div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
