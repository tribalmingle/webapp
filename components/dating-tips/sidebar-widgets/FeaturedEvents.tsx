'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users } from 'lucide-react'
import { format } from 'date-fns'

const FEATURED_EVENTS = [
  {
    id: 'event-london-mixer',
    title: 'Heritage & Cocktails Evening',
    city: 'London',
    country: 'United Kingdom',
    startDate: '2026-01-15T19:00:00.000Z',
    attendeeCount: 24,
  },
  {
    id: 'event-lagos-supper',
    title: 'Chef-led Supper Club',
    city: 'Lagos',
    country: 'Nigeria',
    startDate: '2026-01-20T19:00:00.000Z',
    attendeeCount: 18,
  },
  {
    id: 'event-newyork-rooftop',
    title: 'Rooftop Singles Soirée',
    city: 'New York',
    country: 'United States',
    startDate: '2026-01-25T18:30:00.000Z',
    attendeeCount: 32,
  },
]

export function FeaturedEvents() {
  return (
    <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl p-6 shadow-xl border border-neutral-700">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">Upcoming Events</h3>
        <p className="text-sm text-neutral-400">Meet singles in real life</p>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {FEATURED_EVENTS.map((event) => {
          const eventDate = new Date(event.startDate)
          const formattedDate = format(eventDate, 'MMM d, yyyy')
          const formattedTime = format(eventDate, 'h:mm a')

          return (
            <div
              key={event.id}
              className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700 hover:border-purple-500/50 transition-colors"
            >
              {/* Location & Date */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 text-purple-400 text-sm mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="font-medium">{event.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span>{formattedDate}</span>
                    <span className="text-neutral-500">•</span>
                    <span>{formattedTime}</span>
                  </div>
                </div>
              </div>

              {/* Event Name */}
              <h4 className="text-white font-semibold text-sm mb-3 leading-snug">
                {event.title}
              </h4>

              {/* Attendees & CTA */}
              <div className="flex items-center justify-between">
                {/* Attendee Avatars */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 border-2 border-neutral-800 flex items-center justify-center"
                      >
                        <Users className="w-3 h-3 text-white" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs text-neutral-400">
                    {event.attendeeCount}+ going
                  </span>
                </div>

                {/* View Event Button */}
                <Link
                  href={`/events/${event.id}`}
                  className="text-xs font-semibold text-gold-warm hover:text-gold-deep transition-colors"
                >
                  View Event →
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {/* View All Link */}
      <div className="mt-5 pt-5 border-t border-neutral-700">
        <Link
          href="/events"
          className="block text-center text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          View All Events
        </Link>
      </div>
    </div>
  )
}
