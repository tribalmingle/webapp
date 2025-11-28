"use client"

import { useMemo } from 'react'
import { Calendar, MapPin, ExternalLink } from 'lucide-react'

import type { MarketingEvent } from '@/lib/contentful'
import { trackClientEvent } from '@/lib/analytics/client'
import { Badge } from '@/components/ui/badge'

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
  theme?: 'light' | 'dark'
}

export function EventsSpotlightSection({ events, locale, copy, theme = 'light' }: EventsSpotlightSectionProps) {
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

  const textColorPrimary = theme === 'dark' ? 'text-white' : 'text-text-primary'
  const textColorSecondary = theme === 'dark' ? 'text-neutral-400' : 'text-text-secondary'
  const cardBg = theme === 'dark' ? 'bg-neutral-900/50 border-white/10' : 'bg-background-tertiary/80 border-border-gold/30'

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <Badge variant="purple" className="mb-6">
          <Calendar className="w-3 h-3 mr-1" />
          {copy.eyebrow}
        </Badge>
        <h2 className={`text-h1 font-display ${textColorPrimary} mb-4`}>
          {copy.title}
        </h2>
        <p className={`text-body-lg ${textColorSecondary} max-w-3xl mx-auto`}>
          {copy.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {events.map((event, index) => (
          <article
            key={event.id}
            className={`flex h-full flex-col rounded-3xl border ${cardBg} p-6 shadow-premium card-lift`}
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge variant="gold" className="text-caption bg-gold-warm text-white border-transparent">
                <Calendar className="w-3 h-3 mr-1" />
                {dateFormatter.format(new Date(event.startDate))}
              </Badge>
              <Badge variant="outline" className={`text-caption ${theme === 'dark' ? 'text-white border-white/20' : ''}`}>
                <MapPin className="w-3 h-3 mr-1" />
                {event.city}, {event.country}
              </Badge>
              {event.isVirtual ? (
                <Badge variant="purple" className="text-caption">
                  Virtual
                </Badge>
              ) : null}
            </div>
            <h3 className={`text-h2 ${textColorPrimary} mb-3`}>{event.title}</h3>
            <p className={`text-body-sm ${textColorSecondary} mb-6`}>{event.description}</p>
            <div className="mt-auto flex flex-col gap-3">
              <p className={`text-body-sm ${theme === 'dark' ? 'text-neutral-500' : 'text-text-tertiary'}`}>
                <span className={`font-semibold ${textColorSecondary}`}>Starts:</span> {formatDateRange(event.startDate, event.endDate, dateFormatter)}
              </p>
              {event.rsvpUrl ? (
                <a
                  href={event.rsvpUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-gradient px-6 py-3 text-body-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
                  onClick={() => handleClick(event, index)}
                >
                  {copy.ctaLabel}
                  <ExternalLink className="w-4 h-4" />
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
