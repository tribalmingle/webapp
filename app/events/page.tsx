"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarIcon, MapPin, Sparkles, Users } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useLaunchDarklyFlag } from '@/hooks/use-launchdarkly-flag'
import { cn } from '@/lib/utils'

export type EventsApiItem = {
  id: string
  slug: string
  title: string
  description: string
  startAt: string
  endAt: string
  timezone?: string
  tribe?: string
  tags: string[]
  location: { type: 'virtual' | 'in_person'; city?: string; country?: string; meetingUrl?: string; venue?: string }
  ticketing: { priceCents: number; currency: string; provider: string }
  capacity: number
  waitlistEnabled: boolean
  attendeeCount: number
  waitlistCount: number
  seatsRemaining: number
  registration?: { status: 'pending' | 'confirmed' | 'waitlisted' | 'cancelled'; paymentStatus: string }
}

const MODE_FILTERS = [
  { id: 'all', label: 'All formats' },
  { id: 'virtual', label: 'Virtual' },
  { id: 'in_person', label: 'IRL' },
] as const

export default function EventsPage() {
  const eventsFlag = useLaunchDarklyFlag('events-hub', true)
  const { toast } = useToast()
  const [mode, setMode] = useState<(typeof MODE_FILTERS)[number]['id']>('all')
  const [tribe, setTribe] = useState('')
  const [events, setEvents] = useState<EventsApiItem[]>([])
  const [loading, setLoading] = useState(false)
  const [rsvpTarget, setRsvpTarget] = useState<string | null>(null)

  const queryKey = useMemo(() => `${mode}|${tribe}`, [mode, tribe])

  useEffect(() => {
    const controller = new AbortController()
    async function loadEvents() {
      if (!eventsFlag) return
      setLoading(true)
      const params = new URLSearchParams()
      if (mode !== 'all') params.set('mode', mode)
      if (tribe) params.set('tribe', tribe)
      const response = await fetch(`/api/events?${params.toString()}`, { signal: controller.signal })
      const json = await response.json().catch(() => null)
      if (response.ok && json?.data) {
        setEvents(json.data)
      }
      setLoading(false)
    }
    loadEvents().catch(() => setLoading(false))
    return () => controller.abort()
  }, [eventsFlag, mode, queryKey, tribe])

  const handleRsvp = useCallback(async (eventId: string) => {
    setRsvpTarget(eventId)
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'member_hub' }),
      })
      const json = await response.json()
      if (!response.ok) {
        throw new Error(json?.error ?? 'Unable to RSVP')
      }
      toast({ title: json.data?.status === 'waitlisted' ? 'Waitlist joined' : 'RSVP confirmed', description: `You are ${json.data?.status} for this event.` })
      setEvents((prev) => prev.map((event) => (event.id === eventId ? { ...event, registration: json.data } : event)))
    } catch (error) {
      toast({ title: 'RSVP failed', description: error instanceof Error ? error.message : 'Please try again later', variant: 'destructive' })
    } finally {
      setRsvpTarget(null)
    }
  }, [toast])

  const heroStats = useMemo(() => {
    const upcoming = events.length
    const seats = events.reduce((acc, item) => acc + item.seatsRemaining, 0)
    const waitlist = events.reduce((acc, item) => acc + item.waitlistCount, 0)
    return { upcoming, seats, waitlist }
  }, [events])

  if (!eventsFlag) {
    return (
      <MemberAppShell title="Events" description="Events hub is coming soon.">
        <Card className="rounded-3xl border-dashed border-primary/40 p-10 text-center text-muted-foreground">
          Concierge is curating the next wave of circles. Check back shortly.
        </Card>
      </MemberAppShell>
    )
  }

  return (
    <MemberAppShell
      title="Events"
      description="Cultural salons, guardian circles, and curated IRL moments from the Tribal Mingle team."
      contextualNav={
        <div className="flex flex-wrap gap-2">
          {MODE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                mode === filter.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setMode(filter.id)}
            >
              {filter.label}
            </button>
          ))}
          <Input
            value={tribe}
            onChange={(event) => setTribe(event.target.value)}
            placeholder="Filter by tribe"
            className="h-8 w-40 text-xs"
          />
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Upcoming events" value={heroStats.upcoming} icon={CalendarIcon} loading={loading} />
        <StatsCard label="Seats remaining" value={heroStats.seats} icon={Users} loading={loading} />
        <StatsCard label="Waitlist" value={heroStats.waitlist} icon={Sparkles} loading={loading} />
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} onRsvp={handleRsvp} disabled={rsvpTarget === event.id} />
        ))}
        {!loading && !events.length && (
          <Card className="rounded-3xl border-dashed border-muted-foreground/40 p-8 text-center text-muted-foreground">
            No events match these filters yet. Try broadening your search.
          </Card>
        )}
      </div>
    </MemberAppShell>
  )
}

function StatsCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string
  value: number
  icon: typeof CalendarIcon
  loading: boolean
}) {
  return (
    <Card className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-none">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold">{loading ? '—' : value}</p>
    </Card>
  )
}

function formatDateRange(startIso: string, endIso: string, timezone?: string) {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
  })
  const startLabel = formatter.format(start)
  const endLabel = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: 'numeric',
  }).format(end)

  return `${startLabel} → ${endLabel}${timezone ? ` (${timezone})` : ''}`
}

function EventCard({ event, onRsvp, disabled }: { event: EventsApiItem; onRsvp: (eventId: string) => Promise<void>; disabled: boolean }) {
  const dateLabel = formatDateRange(event.startAt, event.endAt, event.timezone)
  const isVirtual = event.location.type === 'virtual'
  const registrationStatus = event.registration?.status

  return (
    <Card className="flex flex-col gap-4 rounded-3xl border border-border/60 p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">{event.tribe ?? 'All tribes'}</p>
          <h3 className="text-2xl font-semibold">{event.title}</h3>
        </div>
        <Badge variant={isVirtual ? 'secondary' : 'outline'}>{isVirtual ? 'Virtual' : 'In person'}</Badge>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          {dateLabel}
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {isVirtual ? event.location.meetingUrl ?? 'Live stream' : `${event.location.city ?? 'TBD'}, ${event.location.country ?? ''}`}
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {event.attendeeCount}/{event.capacity} confirmed
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {event.tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="outline">
            #{tag}
          </Badge>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-3 pt-4">
        {registrationStatus ? (
          <Badge variant={registrationStatus === 'waitlisted' ? 'secondary' : 'default'}>
            {registrationStatus === 'waitlisted' ? 'On waitlist' : 'You are in'}
          </Badge>
        ) : (
          <Button className="flex-1" disabled={disabled} onClick={() => onRsvp(event.id)}>
            {event.seatsRemaining === 0 ? (event.waitlistEnabled ? 'Join waitlist' : 'Sold out') : 'RSVP'}
          </Button>
        )}
        <Button variant="ghost" asChild>
          <a href={`/events/${event.slug}`}>Details</a>
        </Button>
      </div>
    </Card>
  )
}
