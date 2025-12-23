"use client"

import { useMemo, useState, useEffect } from 'react'
import { Calendar, MapPin, ExternalLink, Users, Clock } from 'lucide-react'

import type { MarketingEvent } from '@/lib/contentful'
import { trackClientEvent } from '@/lib/analytics/client'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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

// City gradient backgrounds
const CITY_GRADIENTS: Record<string, string> = {
  Lagos: 'linear-gradient(135deg, #8B5CF6 0%, #C026D3 100%)',
  London: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  'New York': 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  Manchester: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  Accra: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
  Nairobi: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  Houston: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
}

export function EventsSpotlightSection({ events, locale, copy, theme = 'light' }: EventsSpotlightSectionProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  // Featured cities for the landing page
  const FEATURED_CITIES = ['London', 'Lagos', 'New York', 'Manchester']
  
  // Filter and limit to 4 featured events
  const featuredEvents = events
    .filter(event => FEATURED_CITIES.includes(event.city))
    .slice(0, 4)
  
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

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <Badge variant="purple" className="mb-6 shadow-lg">
          <Calendar className="w-3 h-3 mr-1" />
          {copy.eyebrow}
        </Badge>
        <h2 className="text-h1 font-display text-purple-royal-dark mb-4">
          {copy.title}
        </h2>
        <p className="text-body-lg text-purple-royal-dark max-w-3xl mx-auto">
          {copy.description}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {featuredEvents.map((event, index) => {
          const gradient = CITY_GRADIENTS[event.city] || CITY_GRADIENTS.Lagos
          const daysUntil = Math.ceil((new Date(event.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          const isHovered = hoveredIndex === index
          
          return (
            <article
              key={event.id}
              className={cn(
                "relative flex h-full flex-col rounded-2xl bg-white overflow-hidden shadow-xl transition-all duration-500",
                "hover:shadow-2xl hover:scale-105 hover:-translate-y-2"
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Ticket-style perforated edge */}
              <div 
                className="h-24 relative"
                style={{ background: gradient }}
              >
                {/* City name and skyline effect */}
                <div className="absolute inset-0 flex items-center justify-between px-6 text-white">
                  <div>
                    <p className="text-sm font-semibold opacity-90">{event.city}</p>
                    <p className="text-2xl font-display font-bold">{event.title}</p>
                  </div>
                  <MapPin className="w-8 h-8 opacity-60" />
                </div>
                
                {/* Perforated edge effect */}
                <div className="absolute -bottom-2 left-0 right-0 h-4 flex justify-between px-2">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-3 h-3 rounded-full bg-white"
                      style={{ transform: 'translateY(50%)' }}
                    />
                  ))}
                </div>
              </div>

              {/* Card content */}
              <div className="p-6 flex-1 flex flex-col">
                {/* Date and type badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs font-bold bg-neutral-100 text-neutral-900 border-neutral-300">
                    <Calendar className="w-3 h-3 mr-1" />
                    {dateFormatter.format(new Date(event.startDate))}
                  </Badge>
                  {event.isVirtual && (
                    <Badge variant="purple" className="text-xs">
                      Virtual
                    </Badge>
                  )}
                  {daysUntil > 0 && daysUntil < 30 && (
                    <Badge variant="gold" className="text-xs animate-pulse">
                      <Clock className="w-3 h-3 mr-1" />
                      {daysUntil} days
                    </Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-body text-neutral-600 mb-6 flex-1">
                  {event.description}
                </p>

                {/* Attendee avatars (mock data) */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-t border-neutral-100 pt-4">
                  <div className="flex -space-x-2">
                    {Array.from({ length: 3 }).map((_, i) => {
                      const genderList = ['men', 'women']
                      const gender = i % 2 === 0 ? 'women' : 'men'
                      const imageId = ((index * 10) + i) % 99
                      return (
                        <img
                          key={i}
                          src={`https://randomuser.me/api/portraits/${gender}/${imageId}.jpg`}
                          alt={`Attendee ${i + 1}`}
                          className="w-8 h-8 rounded-full border-2 border-white shadow-md object-cover"
                        />
                      )
                    })}
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-neutral-200 flex items-center justify-center text-xs font-semibold text-neutral-600 shadow-md">
                      +{12 + index * 5}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-neutral-600">
                    <Users className="w-4 h-4" />
                    <span className="font-semibold">{15 + index * 5}</span> attending
                  </div>
                  <Badge variant="outline" className="ml-auto text-xs text-orange-600 border-orange-200 bg-orange-50">
                    Filling Fast
                  </Badge>
                </div>

                {/* RSVP Button */}
                {event.rsvpUrl && (
                  <a
                    href={event.rsvpUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(
                      "inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-body-sm font-bold text-white shadow-lg transition-all duration-300",
                      isHovered && "shadow-2xl"
                    )}
                    style={{ background: gradient }}
                    onClick={() => handleClick(event, index)}
                  >
                    {copy.ctaLabel}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </div>
      
      {/* View More Events Button */}
      <div className="mt-12 text-center">
        <a
          href="/events"
          className="inline-flex items-center gap-2 px-8 py-4 bg-purple-royal text-white font-bold rounded-full hover:bg-purple-royal-light transition-all shadow-lg hover:shadow-xl hover:scale-105"
        >
          View More Events
          <ExternalLink className="w-4 h-4" />
        </a>
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
