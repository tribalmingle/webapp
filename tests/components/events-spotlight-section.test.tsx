import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { EventsSpotlightSection } from '@/components/marketing/events-spotlight-section'
import type { MarketingEvent } from '@/lib/contentful'
import { trackClientEvent } from '@/lib/analytics/client'

vi.mock('@/lib/analytics/client', () => ({
  trackClientEvent: vi.fn(),
}))

const events: MarketingEvent[] = [
  {
    id: 'event-1',
    title: 'Chef-led Supper',
    city: 'Lagos',
    country: 'Nigeria',
    startDate: '2025-02-20T00:00:00.000Z',
    endDate: '2025-02-21T00:00:00.000Z',
    description: 'Taste heritage menus.',
    heroImage: undefined,
    rsvpUrl: 'https://tribalmingle.com/events/lagos',
    isVirtual: false,
  },
]

const copy = {
  eyebrow: 'On the road',
  title: 'Premium mixers',
  description: 'Meet verified members worldwide.',
  ctaLabel: 'RSVP',
}

describe('EventsSpotlightSection', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders events with location and date', () => {
    render(<EventsSpotlightSection events={events} locale="en" copy={copy} />)

    expect(screen.getByText('Chef-led Supper')).toBeInTheDocument()
    expect(screen.getByText('Lagos, Nigeria')).toBeInTheDocument()
  })

  it('tracks RSVP clicks', () => {
    render(<EventsSpotlightSection events={events} locale="en" copy={copy} />)

    fireEvent.click(screen.getByText('RSVP'))
    expect(trackClientEvent).toHaveBeenCalledWith('marketing_event_rsvp', expect.objectContaining({
      eventId: 'event-1',
      locale: 'en',
    }))
  })
})
