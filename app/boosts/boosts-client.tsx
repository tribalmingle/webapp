"use client"

import { useEffect, useState } from 'react'
import { Activity, PlusCircle } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface BoostStrip {
  active: Array<{ sessionId: string; placement: string; endsAt: string }>
  upcoming: Array<{ sessionId: string; placement: string; startsAt: string }>
}

export default function BoostsClient() {
  const [data, setData] = useState<BoostStrip | null>(null)

  useEffect(() => {
    fetch('/api/boosts/strip')
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setData(json.data)
      })
      .catch(() => setData(null))
  }, [])

  return (
    <MemberAppShell title="Boost strip" description="Manage spotlight + travel boosts feeding discovery.">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-3xl border border-border/70 bg-card/80 p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4 text-primary" /> Active boosts
          </div>
          <div className="mt-4 space-y-3">
            {data?.active?.length ? (
              data.active.map((session) => (
                <div key={session.sessionId} className="rounded-2xl border border-border/60 p-3 text-sm">
                  <p className="font-medium capitalize">{session.placement}</p>
                  <p className="text-xs text-muted-foreground">Ends {new Date(session.endsAt).toLocaleTimeString()}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No live boosts</p>
            )}
          </div>
        </Card>
        <Card className="rounded-3xl border border-border/70 bg-card/80 p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PlusCircle className="h-4 w-4 text-primary" /> Upcoming windows
          </div>
          <div className="mt-4 space-y-3">
            {data?.upcoming?.length ? (
              data.upcoming.map((session) => (
                <div key={session.sessionId} className="rounded-2xl border border-border/60 p-3 text-sm">
                  <p className="font-medium capitalize">{session.placement}</p>
                  <p className="text-xs text-muted-foreground">Starts {new Date(session.startsAt).toLocaleTimeString()}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming boosts scheduled</p>
            )}
          </div>
        </Card>
      </div>
    </MemberAppShell>
  )
}
