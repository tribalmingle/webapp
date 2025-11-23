import { ObjectId } from 'mongodb'

import type {
  CommunityPostDocument,
  EventDocument,
  EventRegistrationDocument,
  ProfileDocument,
} from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'
import { withSpan } from '@/lib/observability/tracing'
import { AnalyticsService } from './analytics-service'

export type EventFilters = {
  tribe?: string
  mode?: 'virtual' | 'in_person'
  tags?: string[]
  limit?: number
}

export type EventSummary = {
  id: string
  slug: string
  title: string
  description: string
  startAt: string
  endAt: string
  timezone?: string
  tribe?: string
  tags: string[]
  location: EventDocument['location']
  ticketing: EventDocument['ticketing']
  capacity: number
  waitlistEnabled: boolean
  attendeeCount: number
  waitlistCount: number
  seatsRemaining: number
  registration?: Pick<EventRegistrationDocument, 'status' | 'paymentStatus'>
}

export type EventDetail = EventSummary & {
  assets: EventDocument['assets']
  hosts: Array<{ userId: string; name?: string; tribe?: string }>
  visibility: EventDocument['visibility']
}

export type EventFeedbackPayload = {
  rating: number
  highlights?: string
  suggestions?: string
}

export class EventsServiceError extends Error {
  code: string
  status: number

  constructor(code: string, message: string, status = 400) {
    super(message)
    this.code = code
    this.status = status
  }
}

export class EventsService {
  static async listUpcoming(userId: string, filters?: EventFilters) {
    const spanAttributes: Record<string, string | number | boolean> = { userId }
    spanAttributes.hasFilters = Boolean(filters)

    return withSpan('events.listUpcoming', async () => {
      const db = await getMongoDb()
      const eventsCollection = db.collection<EventDocument>('events')
      const registrations = db.collection<EventRegistrationDocument>('event_registrations')
      const now = new Date()

      const query: Record<string, unknown> = {
        startAt: { $gte: new Date(now.getTime() - 1000 * 60 * 60 * 6) },
        moderationState: 'published',
      }

      if (filters?.tribe) {
        query.$or = [{ visibility: 'public' }, { tribe: filters.tribe }, { hostUserIds: new ObjectId(userId) }]
      }

      if (filters?.mode) {
        query['location.type'] = filters.mode
      }

      if (filters?.tags?.length) {
        query.tags = { $in: filters.tags }
      }

      const limit = Math.min(filters?.limit ?? 20, 50)
      const docs = await eventsCollection.find(query).sort({ startAt: 1 }).limit(limit).toArray()
      if (!docs.length) {
        return [] as EventSummary[]
      }

      const eventIds = docs.map((doc) => doc._id!).filter(Boolean)
      const counts = await registrations
        .aggregate([
          { $match: { eventId: { $in: eventIds }, status: { $in: ['pending', 'confirmed', 'waitlisted'] } } },
          {
            $group: {
              _id: '$eventId',
              confirmed: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0],
                },
              },
              waitlisted: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'waitlisted'] }, 1, 0],
                },
              },
            },
          },
        ])
        .toArray()

      const countMap = new Map<string, { confirmed: number; waitlisted: number }>()
      counts.forEach((entry) => {
        countMap.set(entry._id.toHexString(), {
          confirmed: entry.confirmed,
          waitlisted: entry.waitlisted,
        })
      })

      const userRegistrations = await registrations
        .find({ eventId: { $in: eventIds }, userId: new ObjectId(userId) })
        .toArray()
      const registrationMap = new Map<string, EventRegistrationDocument>()
      userRegistrations.forEach((reg) => registrationMap.set(reg.eventId.toHexString(), reg))

      return docs.map((doc) => this.toSummary(doc, countMap.get(doc._id!.toHexString()), registrationMap.get(doc._id!.toHexString())))
    }, spanAttributes)
  }

  static async getEventDetail(eventIdOrSlug: string, userId?: string) {
    return withSpan('events.detail', async () => {
      const db = await getMongoDb()
      const eventsCollection = db.collection<EventDocument>('events')
      const registrations = db.collection<EventRegistrationDocument>('event_registrations')
      const query = this.buildEventLookup(eventIdOrSlug)
      const doc = await eventsCollection.findOne(query)
      if (!doc) {
        return null
      }

      const regCountsDoc = await registrations
        .aggregate([
          { $match: { eventId: doc._id!, status: { $in: ['pending', 'confirmed', 'waitlisted'] } } },
          {
            $group: {
              _id: '$eventId',
              confirmed: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0],
                },
              },
              waitlisted: {
                $sum: {
                  $cond: [{ $eq: ['$status', 'waitlisted'] }, 1, 0],
                },
              },
            },
          },
        ])
        .next()

      const regCounts = regCountsDoc
        ? {
            confirmed: regCountsDoc.confirmed as number,
            waitlisted: regCountsDoc.waitlisted as number,
          }
        : undefined

      const registration = userId
        ? await registrations.findOne({ eventId: doc._id!, userId: new ObjectId(userId) })
        : null

      const profileCollection = db.collection<ProfileDocument>('profiles')
      const hosts = await profileCollection
        .find({ userId: { $in: doc.hostUserIds } })
        .project({ userId: 1, name: 1, tribe: 1 })
        .toArray()

      const detail: EventDetail = {
        ...this.toSummary(doc, regCounts, registration ?? undefined),
        assets: doc.assets,
        hosts: hosts.map((host) => ({ userId: host.userId.toHexString(), name: host.name, tribe: host.tribe })),
        visibility: doc.visibility,
      }

      if (userId) {
        void AnalyticsService.track({
          eventType: 'events.viewed',
          userId,
          properties: { eventId: detail.id, slug: detail.slug },
        })
      }

      return detail
    }, { eventIdOrSlug, userId: userId ?? 'anonymous' })
  }

  static async registerForEvent(eventIdOrSlug: string, userId: string, params?: { source?: EventRegistrationDocument['source'] }) {
    return withSpan('events.register', async () => {
      const db = await getMongoDb()
      const eventsCollection = db.collection<EventDocument>('events')
      const registrations = db.collection<EventRegistrationDocument>('event_registrations')
      const query = this.buildEventLookup(eventIdOrSlug)
      const event = await eventsCollection.findOne(query)
      if (!event) {
        throw new EventsServiceError('event_not_found', 'Event not found', 404)
      }
      if (event.startAt < new Date()) {
        throw new EventsServiceError('event_in_past', 'This event already started', 400)
      }

      const userObjectId = new ObjectId(userId)
      const existing = await registrations.findOne({ eventId: event._id!, userId: userObjectId })
      if (existing && ['confirmed', 'waitlisted'].includes(existing.status)) {
        return { status: existing.status, paymentStatus: existing.paymentStatus }
      }

      const confirmedCount = await registrations.countDocuments({ eventId: event._id!, status: 'confirmed' })
      const seatsRemaining = Math.max(0, event.capacity - confirmedCount)
      const shouldWaitlist = seatsRemaining === 0

      if (shouldWaitlist && !event.waitlistEnabled) {
        throw new EventsServiceError('event_full', 'This event is full', 409)
      }

      const status: EventRegistrationDocument['status'] = shouldWaitlist ? 'waitlisted' : 'confirmed'
      const paymentStatus: EventRegistrationDocument['paymentStatus'] = event.ticketing.priceCents > 0
        ? shouldWaitlist
          ? 'none'
          : 'requires_payment'
        : 'none'

      const source: EventRegistrationDocument['source'] = params?.source ?? 'organic'

      await registrations.updateOne(
        { eventId: event._id!, userId: userObjectId },
        {
          $set: {
            eventId: event._id!,
            userId: userObjectId,
            status,
            paymentStatus,
            source,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true },
      )

      await AnalyticsService.track({
        eventType: 'events.rsvp',
        userId,
        properties: { eventId: event._id?.toHexString(), status },
      })

      return { status, paymentStatus }
    }, { eventIdOrSlug, userId })
  }

  static async submitFeedback(eventIdOrSlug: string, userId: string, payload: EventFeedbackPayload) {
    return withSpan('events.feedback', async () => {
      const db = await getMongoDb()
      const eventsCollection = db.collection<EventDocument>('events')
      const posts = db.collection<CommunityPostDocument>('community_posts')
      const query = this.buildEventLookup(eventIdOrSlug)
      const event = await eventsCollection.findOne(query)
      if (!event) {
        throw new EventsServiceError('event_not_found', 'Event not found', 404)
      }

      if (!Number.isFinite(payload.rating) || payload.rating < 1 || payload.rating > 5) {
        throw new EventsServiceError('invalid_rating', 'Rating must be between 1 and 5')
      }

      await posts.insertOne({
        authorId: new ObjectId(userId),
        visibility: 'private',
        body: payload.highlights ?? 'Shared anonymous feedback',
        metadata: {
          kind: 'event_feedback',
          eventId: event._id?.toHexString(),
          rating: payload.rating,
          suggestions: payload.suggestions,
        },
        mentions: [],
        media: [],
        poll: undefined,
        reactionCounts: [],
        commentCount: 0,
        shareCount: 0,
        safety: { state: 'clear' },
        tags: ['event_feedback'],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as CommunityPostDocument)

      await AnalyticsService.track({
        eventType: 'events.feedback_submitted',
        userId,
        properties: { eventId: event._id?.toHexString(), rating: payload.rating },
      })
    }, { eventIdOrSlug, userId })
  }

  private static buildEventLookup(eventIdOrSlug: string) {
    if (ObjectId.isValid(eventIdOrSlug)) {
      return { _id: new ObjectId(eventIdOrSlug) }
    }
    return { slug: eventIdOrSlug }
  }

  private static toSummary(
    doc: EventDocument,
    counts?: { confirmed: number; waitlisted: number },
    registration?: EventRegistrationDocument,
  ): EventSummary {
    const confirmed = counts?.confirmed ?? 0
    const waitlisted = counts?.waitlisted ?? 0
    const seatsRemaining = Math.max(0, doc.capacity - confirmed)
    return {
      id: doc._id!.toHexString(),
      slug: doc.slug,
      title: doc.title,
      description: doc.description,
      startAt: doc.startAt.toISOString(),
      endAt: doc.endAt.toISOString(),
      timezone: doc.timezone,
      tribe: doc.tribe,
      tags: doc.tags,
      location: doc.location,
      ticketing: doc.ticketing,
      capacity: doc.capacity,
      waitlistEnabled: doc.waitlistEnabled,
      attendeeCount: confirmed,
      waitlistCount: waitlisted,
      seatsRemaining,
      registration: registration ? { status: registration.status, paymentStatus: registration.paymentStatus } : undefined,
    }
  }
}
