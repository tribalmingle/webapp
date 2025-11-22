"use client"

import { useMemo } from 'react'

import type { MarketingEvent } from '@/lib/contentful'
import { trackClientEvent } from '@/lib/analytics/client'

export type EventsSpotlightCopy = {
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
}

type EventsSpotlightSectionProps = {
  events: MarketingEvent[]
  locale: string
  copy: EventsSpotlightCopy
}

export function EventsSpotlightSection({ events, locale, copy }: EventsSpotlightSectionProps) {
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }), [locale])

  const handleClick = (event: MarketingEvent, position: number) => {
    if (!event.rsvpUrl) {
      return
    }

    trackClientEvent('marketing_event_rsvp', {
      eventId: event.id,
      locale,
      position,
      isVirtual: event.isVirtual ?? false,
    })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">{copy.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{copy.title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {events.map((event, index) => (
          <article
            key={event.id}
            className="flex h-full flex-col rounded-3xl border border-blue-100 bg-white/80 p-6 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-widest text-blue-500">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-500">
                {dateFormatter.format(new Date(event.startDate))}
              </span>
              <span>{event.city}, {event.country}</span>
              {event.isVirtual ? <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-500">Virtual</span> : null}
            </div>
            <h3 className="mt-4 text-2xl font-semibold text-foreground">{event.title}</h3>
            <p className="mt-3 text-sm text-muted-foreground">{event.description}</p>
            <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Starts:</span> {formatDateRange(event.startDate, event.endDate, dateFormatter)}
              </p>
              {event.rsvpUrl ? (
                <a
                  href={event.rsvpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2 font-semibold text-accent-foreground transition hover:opacity-90"
                  onClick={() => handleClick(event, index)}
                >
                  {copy.ctaLabel}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function formatDateRange(startDate: string, endDate: string | undefined, formatter: Intl.DateTimeFormat) {
  try {
    const start = formatter.format(new Date(startDate))
    if (!endDate) {
      return start
    }
    const end = formatter.format(new Date(endDate))
    if (start === end) {
      return start
    }
    return `${start} – ${end}`
  } catch (error) {
    return startDate
  }
}
