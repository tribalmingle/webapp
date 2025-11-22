import { ObjectId } from 'mongodb'

import type { TrustEventDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'

const COLLECTION_NAME = 'trust_events'
const DEFAULT_SCORE = 0
const DEFAULT_AGGREGATE = 0.5

export type TrustEventInput = {
  userId: string | ObjectId
  eventType: TrustEventDocument['eventType']
  source?: TrustEventDocument['source']
  scoreDelta?: number
  aggregateScore?: number
  context?: TrustEventDocument['context']
  relatedIds?: Array<string | ObjectId>
  expiresAt?: Date
}

export async function createTrustEvent(input: TrustEventInput) {
  const db = await getMongoDb()
  const now = new Date()

  const document: TrustEventDocument = {
    _id: new ObjectId(),
    userId: toObjectId(input.userId),
    eventType: input.eventType,
    source: input.source ?? 'system',
    scoreDelta: input.scoreDelta ?? DEFAULT_SCORE,
    aggregateScore: input.aggregateScore ?? DEFAULT_AGGREGATE,
    context: input.context,
    relatedIds: input.relatedIds?.map(toObjectId) ?? [],
    expiresAt: input.expiresAt,
    createdAt: now,
    updatedAt: now,
  }

  await db.collection<TrustEventDocument>(COLLECTION_NAME).insertOne(document)
  return document
}

function toObjectId(value: string | ObjectId) {
  return value instanceof ObjectId ? value : new ObjectId(value)
}
