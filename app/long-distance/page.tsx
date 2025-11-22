'use client'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const visaTips = [
  { title: 'UK ↔ Nigeria', detail: 'Average visitor visa wait ~28 days. Concierge can escalate via priority service when available.' },
  { title: 'Canada ↔ Ghana', detail: 'Invite letter + bank proof still required. Toolkit includes templated guardian letters.' },
  { title: 'France ↔ Kenya', detail: 'Schengen consulate backlog easing; schedule biometrics 6 weeks out.' },
]

const flightHacks = [
  { title: 'Skyscanner alerts', detail: 'Enable one-click alerts for paired home airports plus “any nearby” radius to catch mistake fares.' },
  { title: 'Partner miles', detail: 'Use concierge miles bank to top-up whichever partner is short for upgrades.' },
  { title: 'Stopover rituals', detail: 'Plan 12-hour stopovers in shared cities (Accra, Casablanca) for micro-dates.' },
]

const remoteDateIdeas = [
  'Co-stream a cooking class, swap grocery lists, and deliver each other’s pantry boxes ahead of time.',
  'Play the Values Roulette game in-app—AI concierge generates reflection prompts based on your tribe mix.',
  'Send voice notes during sunrise in each city, then stitch them into a shared keepsake playlist.',
]

export default function LongDistanceToolkitPage() {
  return (
    <MemberAppShell title="Long-distance toolkit" description="Visas, flights, and rituals in one place.">
      <div className="space-y-8">
        <section className="rounded-3xl border border-border bg-card/60 p-6">
          <h2 className="text-xl font-semibold">Visa & compliance briefs</h2>
          <p className="text-sm text-muted-foreground">Tap a lane to download the concierge briefing PDF or request a steward consult.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {visaTips.map((tip) => (
              <Card key={tip.title} className="p-4">
                <p className="text-sm font-semibold">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.detail}</p>
                <Button variant="link" className="mt-2 h-auto p-0 text-xs">Download brief</Button>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card/50 p-6">
          <h2 className="text-xl font-semibold">Flight deals + rituals</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {flightHacks.map((hack) => (
              <Card key={hack.title} className="p-4">
                <p className="text-sm font-semibold">{hack.title}</p>
                <p className="text-xs text-muted-foreground">{hack.detail}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-dashed border-primary/30 bg-primary/5 p-6">
          <h2 className="text-xl font-semibold">Remote date inspiration</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
            {remoteDateIdeas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
          <Button className="mt-4">Ask concierge for a custom ritual</Button>
        </section>
      </div>
    </MemberAppShell>
  )
}
