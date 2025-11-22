import crypto from 'node:crypto'
import { ObjectId } from 'mongodb'

import type { ActivityLogDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'

const COLLECTION_NAME = 'activity_logs'

type ActivityLogResource = ActivityLogDocument['resource']

export type ActivityLogInput = {
  actorId?: string | ObjectId
  actorType?: ActivityLogDocument['actorType']
  action: string
  resource: ActivityLogResource
  metadata?: ActivityLogDocument['metadata']
  ip?: string
  userAgent?: string
}

export async function appendActivityLog(input: ActivityLogInput) {
  const db = await getMongoDb()
  const collection = db.collection<ActivityLogDocument>(COLLECTION_NAME)
  const now = new Date()

  const lastEntry = await collection.find().sort({ createdAt: -1, _id: -1 }).limit(1).next()
  const previousHash = lastEntry?.entryHash

  const document: ActivityLogDocument = {
    _id: new ObjectId(),
    actorId: input.actorId ? toObjectId(input.actorId) : undefined,
    actorType: input.actorType ?? (input.actorId ? 'admin' : 'system'),
    action: input.action,
    resource: {
      collection: input.resource.collection,
      id: input.resource.id ? toObjectId(input.resource.id) : undefined,
    },
    metadata: input.metadata ?? {},
    ip: input.ip,
    userAgent: input.userAgent,
    entryHash: buildEntryHash({
      action: input.action,
      resource: input.resource,
      metadata: input.metadata ?? {},
      actorId: input.actorId ? toObjectId(input.actorId) : undefined,
      timestamp: now.toISOString(),
      previousHash,
    }),
    previousHash,
    createdAt: now,
    updatedAt: now,
  }

  await collection.insertOne(document)
  return document
}

function buildEntryHash(payload: Record<string, unknown>) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

function toObjectId(value: string | ObjectId) {
  return value instanceof ObjectId ? value : new ObjectId(value)
}
