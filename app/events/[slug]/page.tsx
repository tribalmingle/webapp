"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarIcon, MapPin, Sparkles, Users } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

import type { EventDetail } from '@/lib/services/events-service'

export default function EventDetailPage({ params }: { params: { slug: string } }) {
  const { toast } = useToast()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpPending, setRsvpPending] = useState(false)
  const [feedback, setFeedback] = useState({ rating: 5, highlights: '', suggestions: '' })

  useEffect(() => {
    const controller = new AbortController()
    async function loadEvent() {
      setLoading(true)
      const res = await fetch(`/api/events/${params.slug}`, { signal: controller.signal })
      const json = await res.json().catch(() => null)
      if (res.ok) {
        setEvent(json.data)
      }
      setLoading(false)
    }
    loadEvent().catch(() => setLoading(false))
    return () => controller.abort()
  }, [params.slug])

  const handleRsvp = useCallback(async () => {
    if (!event) return
    setRsvpPending(true)
    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'event_detail' }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error ?? 'Unable to RSVP')
      }
      toast({
        title: json.data?.status === 'waitlisted' ? 'Waitlist joined' : 'RSVP confirmed',
        description: `You are ${json.data?.status} for this event`,
      })
      setEvent((prev) => (prev ? { ...prev, registration: json.data } : prev))
    } catch (error) {
      toast({ title: 'RSVP failed', description: error instanceof Error ? error.message : 'Please try again later', variant: 'destructive' })
    } finally {
      setRsvpPending(false)
    }
  }, [event, toast])

  const handleFeedback = useCallback(async () => {
    if (!event) return
    try {
      const res = await fetch(`/api/events/${event.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => null)
        throw new Error(json?.error ?? 'Unable to send feedback')
      }
      toast({ title: 'Feedback sent', description: 'Thanks for sharing with the steward team.' })
      setFeedback({ rating: 5, highlights: '', suggestions: '' })
    } catch (error) {
      toast({ title: 'Feedback failed', description: error instanceof Error ? error.message : 'Please try again later', variant: 'destructive' })
    }
  }, [event, feedback, toast])

  const dateLabel = useMemo(() => {
    if (!event) return ''
    const formatter = new Intl.DateTimeFormat(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'short',
    })
    const endFormatter = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: 'numeric' })
    return `${formatter.format(new Date(event.startAt))} → ${endFormatter.format(new Date(event.endAt))}`
  }, [event])

  if (loading) {
    return (
      <MemberAppShell title="Event" description="Loading">
        <Card className="rounded-3xl border-dashed border-border/60 p-8 text-center text-muted-foreground">Loading event...</Card>
      </MemberAppShell>
    )
  }

  if (!event) {
    return (
      <MemberAppShell title="Event" description="Not found">
        <Card className="rounded-3xl border-dashed border-destructive/40 p-8 text-center text-destructive">
          We could not find that event.
        </Card>
      </MemberAppShell>
    )
  }

  const isVirtual = event.location.type === 'virtual'
  const registrationStatus = event.registration?.status

  return (
    <MemberAppShell title={event.title} description={event.description}>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 space-y-4 rounded-3xl border border-border/70 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isVirtual ? 'secondary' : 'outline'}>{isVirtual ? 'Virtual' : 'In person'}</Badge>
            {event.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon className="h-4 w-4" />
            {dateLabel}
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            {isVirtual ? event.location.meetingUrl ?? 'Live stream link shared after RSVP' : `${event.location.venue ?? event.location.city}, ${event.location.country}`}
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {event.attendeeCount}/{event.capacity} confirmed
          </p>
          <section>
            <h2 className="mb-2 text-lg font-semibold">Hosted by</h2>
            <div className="flex flex-wrap gap-3">
              {event.hosts.map((host) => (
                <Card key={host.userId} className="rounded-2xl border border-border/60 px-4 py-2">
                  <p className="text-sm font-medium">{host.name ?? 'Concierge steward'}</p>
                  <p className="text-xs text-muted-foreground">{host.tribe ?? 'Global tribe'}</p>
                </Card>
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-2 text-lg font-semibold">About</h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">{event.description}</p>
          </section>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-3xl border border-border/70 p-6">
            <h3 className="text-lg font-semibold">Reserve your spot</h3>
            {registrationStatus ? (
              <Badge className="mt-4" variant={registrationStatus === 'waitlisted' ? 'secondary' : 'default'}>
                {registrationStatus === 'waitlisted' ? 'You are on the waitlist' : 'You are confirmed'}
              </Badge>
            ) : (
              <Button className="mt-4 w-full" disabled={rsvpPending} onClick={handleRsvp}>
                {event.seatsRemaining === 0 ? (event.waitlistEnabled ? 'Join waitlist' : 'Sold out') : 'RSVP'}
              </Button>
            )}
            <p className="mt-3 text-sm text-muted-foreground">
              {event.ticketing.priceCents > 0
                ? `Tickets: ${(event.ticketing.priceCents / 100).toLocaleString(undefined, { style: 'currency', currency: event.ticketing.currency })}`
                : 'Free for members'}
            </p>
          </Card>
          <Card className="rounded-3xl border border-border/70 p-6">
            <h3 className="text-lg font-semibold">Share feedback</h3>
            <div className="mt-4 space-y-3">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                value={feedback.rating}
                onChange={(event) => setFeedback((prev) => ({ ...prev, rating: Number(event.target.value) }))}
              />
              <Label htmlFor="highlights">Highlights</Label>
              <Textarea
                id="highlights"
                value={feedback.highlights}
                onChange={(event) => setFeedback((prev) => ({ ...prev, highlights: event.target.value }))}
                placeholder="Favorite moment, steward shoutout, cultural detail..."
              />
              <Label htmlFor="suggestions">Suggestions</Label>
              <Textarea
                id="suggestions"
                value={feedback.suggestions}
                onChange={(event) => setFeedback((prev) => ({ ...prev, suggestions: event.target.value }))}
                placeholder="Anything to improve for the next circle."
              />
              <Button className="w-full" onClick={handleFeedback} variant="secondary">
                Send feedback
              </Button>
            </div>
          </Card>
          <Card className="rounded-3xl border border-border/70 p-6">
            <h3 className="text-lg font-semibold">Need concierge support?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Message the concierge team in chat if you need accessibility accommodations, guardian approvals, or travel planning for this event.
            </p>
          </Card>
        </div>
      </div>
    </MemberAppShell>
  )
}
