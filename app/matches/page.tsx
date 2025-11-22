"use client"

import { useEffect, useState } from 'react'
import { HeartHandshake, ShieldCheck } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface MatchInfo {
  matchId: string
  score: number
  aiOpener?: string
  trustBadges?: string[]
  confirmedAt?: string
  state: string
  insights?: { sharedValues?: string[]; conciergePrompt?: string }
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchInfo[]>([])

  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setMatches(json.data)
      })
      .catch(() => setMatches([]))
  }, [])

  return (
    <MemberAppShell title="Matches" description="Concierge-approved sparks and live insights.">
      <div className="space-y-4">
        {matches.map((match) => (
          <Card key={match.matchId} className="rounded-3xl border border-border/70 bg-card/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HeartHandshake className="h-4 w-4 text-primary" />
                {match.confirmedAt ? `Matched ${new Date(match.confirmedAt).toLocaleDateString()}` : 'Pending' }
              </div>
              <Badge variant="secondary">{Math.round(match.score * 100)}% harmony</Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{match.aiOpener ?? 'Concierge prepping opener...'}</p>
            {match.insights?.conciergePrompt && <p className="mt-2 text-xs text-muted-foreground">{match.insights.conciergePrompt}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {match.trustBadges?.map((badge) => (
                <Badge key={badge} variant="outline" className="gap-1">
                  <ShieldCheck className="h-3 w-3" /> {badge}
                </Badge>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <Button size="sm" variant="outline" className="flex-1">
                View thread
              </Button>
              <Button size="sm" className="flex-1">
                Ask concierge
              </Button>
            </div>
          </Card>
        ))}
        {!matches.length && <Card className="rounded-3xl border border-dashed border-border/70 p-10 text-center text-muted-foreground">No confirmed matches yet. Keep swiping!</Card>}
      </div>
    </MemberAppShell>
  )
}
