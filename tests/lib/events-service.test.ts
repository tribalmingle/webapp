import { ObjectId } from 'mongodb'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EventsService, EventsServiceError } from '@/lib/services/events-service'
import { getMongoDb } from '@/lib/mongodb'

vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(),
}))

vi.mock('@/lib/services/analytics-service', () => ({
  AnalyticsService: { track: vi.fn() },
}))

describe('EventsService.registerForEvent', () => {
  const eventId = new ObjectId()
  const userId = new ObjectId().toHexString()

  const eventsCollection = {
    findOne: vi.fn(),
  }
  const registrationsCollection = {
    findOne: vi.fn(),
    countDocuments: vi.fn(),
    updateOne: vi.fn(),
  }

  const baseEvent = {
    _id: eventId,
    slug: 'culture-night',
    title: 'Culture Night',
    description: 'A night of stories',
    hostUserIds: [new ObjectId()],
    visibility: 'public' as const,
    tags: [],
    startAt: new Date(Date.now() + 1000 * 60 * 60),
    endAt: new Date(Date.now() + 1000 * 60 * 120),
    timezone: 'UTC',
    tribe: 'afropolitan',
    location: { type: 'in_person' as const, city: 'Lagos', country: 'NG' },
    ticketing: { priceCents: 0, currency: 'USD', provider: 'none' as const },
    capacity: 50,
    waitlistEnabled: true,
    moderationState: 'published' as const,
    assets: [],
  }

  beforeEach(() => {
    const db = {
      collection: vi.fn((name: string) => {
        if (name === 'events') return eventsCollection
        if (name === 'event_registrations') return registrationsCollection
        if (name === 'profiles') {
          return {
            find: () => ({
              project: () => ({ toArray: () => Promise.resolve([]) }),
            }),
          }
        }
        return {}
      }),
    }

    vi.mocked(getMongoDb).mockResolvedValue(db as any)

    eventsCollection.findOne.mockResolvedValue({ ...baseEvent })
    registrationsCollection.findOne.mockResolvedValue(null)
    registrationsCollection.countDocuments.mockResolvedValue(10)
    registrationsCollection.updateOne.mockResolvedValue({ acknowledged: true })
  })

  it('confirms registration when seats remain', async () => {
    const result = await EventsService.registerForEvent(eventId.toHexString(), userId)

    expect(result.status).toBe('confirmed')
    expect(registrationsCollection.updateOne).toHaveBeenCalledWith(
      { eventId, userId: new ObjectId(userId) },
      expect.objectContaining({ $set: expect.objectContaining({ status: 'confirmed' }) }),
      { upsert: true },
    )
  })

  it('waitlists when capacity reached and waitlist enabled', async () => {
    registrationsCollection.countDocuments.mockResolvedValue(50)

    const result = await EventsService.registerForEvent(eventId.toHexString(), userId)

    expect(result.status).toBe('waitlisted')
  })

  it('throws when event is full and waitlist disabled', async () => {
    registrationsCollection.countDocuments.mockResolvedValue(50)
    eventsCollection.findOne.mockResolvedValueOnce({ ...baseEvent, waitlistEnabled: false })

    await expect(EventsService.registerForEvent(eventId.toHexString(), userId)).rejects.toBeInstanceOf(EventsServiceError)
  })
})
