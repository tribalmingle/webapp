'use client'

import { useState } from 'react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const INTENT_COPY: Record<string, { title: string; helper: string }> = {
  introduction: {
    title: 'Warm introduction',
    helper: 'Need an opener, trust anchor, and stewardship checklist.',
  },
  date_plan: {
    title: 'Curated date plan',
    helper: 'Map out venues, guardian touchpoints, and follow-ups.',
  },
  long_distance_support: {
    title: 'Long-distance ritual',
    helper: 'Coordinate visa briefs, timezone rituals, and care packages.',
  },
}

export default function ConciergePage() {
  const [intent, setIntent] = useState<'introduction' | 'date_plan' | 'long_distance_support'>('introduction')
  const [homeCity, setHomeCity] = useState('Lagos')
  const [partnerCity, setPartnerCity] = useState('London')
  const [vibe, setVibe] = useState<'casual' | 'adventurous' | 'luxury' | 'cultural'>('cultural')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<null | {
    headline: string
    summary: string
    checklist: string[]
    recommendations: Array<{ title: string; description: string; category: string }>
    followUpActions: Array<{ label: string; dueBy?: string; assignee: string }>
    confidence: number
  }>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setPlan(null)

    try {
      const response = await fetch('/api/concierge/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          memberId: 'self-service',
          name: 'Member',
          homeCity,
          partnerCity,
          preferences: {
            vibe,
          },
          conciergeNotes: notes || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to generate plan')
      }
      setPlan(data.plan)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <MemberAppShell title="AI Concierge" description="Human + AI blended planning">
      <div className="grid gap-6 lg:grid-cols-[380px,1fr]">
        <section className="rounded-2xl border border-border bg-card/60 p-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Intent</label>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={intent}
                onChange={(event) => setIntent(event.target.value as typeof intent)}
              >
                {Object.entries(INTENT_COPY).map(([value, copy]) => (
                  <option key={value} value={value}>
                    {copy.title}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">{INTENT_COPY[intent].helper}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Home city</label>
                <Input value={homeCity} onChange={(event) => setHomeCity(event.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Partner city</label>
                <Input value={partnerCity} onChange={(event) => setPartnerCity(event.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Vibe</label>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={vibe}
                onChange={(event) => setVibe(event.target.value as typeof vibe)}
              >
                <option value="casual">Casual</option>
                <option value="adventurous">Adventurous</option>
                <option value="luxury">Luxury</option>
                <option value="cultural">Cultural</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Concierge notes</label>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Guardian instructions, dietary restrictions, etc." />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Generating…' : 'Generate plan'}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-card/40 p-5">
          {!plan && (
            <div className="text-sm text-muted-foreground">
              Submit details to see the concierge’s recommended flow.
            </div>
          )}
          {plan && (
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Confidence {Math.round(plan.confidence * 100)}%</p>
                <h2 className="text-2xl font-semibold">{plan.headline}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{plan.summary}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Checklist</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {plan.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommendations</p>
                <div className="mt-2 space-y-3">
                  {plan.recommendations.map((rec) => (
                    <div key={rec.title} className="rounded-xl border border-border/60 bg-background/70 p-3">
                      <p className="text-sm font-semibold">{rec.title}</p>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                      <span className="mt-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                        {rec.category}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Follow-ups</p>
                <ol className="mt-2 space-y-2">
                  {plan.followUpActions.map((action) => (
                    <li key={action.label} className="rounded-xl bg-muted/40 p-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span>{action.label}</span>
                        <span className="text-xs text-muted-foreground">{action.assignee}</span>
                      </div>
                      {action.dueBy && (
                        <p className="text-xs text-muted-foreground">Due {new Date(action.dueBy).toLocaleDateString()}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </section>
      </div>
    </MemberAppShell>
  )
}
