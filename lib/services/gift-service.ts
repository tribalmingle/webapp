// Phase 7: Gift sending service (stub + wallet debit integration)
// Fixed imports: use shared mongodb helper + correct wallet debit function name.
import { getMongoDb } from '@/lib/mongodb'
import { getGift } from '../config/gift-catalog'
import { debit } from './wallet-service'

export interface SentGiftRecord {
  _id?: string
  giftId: string
  senderUserId: string
  recipientUserId: string
  coinsSpent: number
  createdAt: Date
  messageId?: string // optional linkage to chat message
}

const inMemoryGifts: SentGiftRecord[] = []

export async function sendGift(params: { senderUserId: string, recipientUserId: string, giftId: string, idempotencyKey?: string, messageId?: string }) {
  const gift = getGift(params.giftId)
  if (!gift) throw new Error('UNKNOWN_GIFT')
  // Debit wallet first (atomic intention); no DB transaction yet (Mongo serverless constraints)
  await debit(params.senderUserId, gift.coinCost, `gift:${gift.id}`, params.idempotencyKey)
  const record: SentGiftRecord = {
    giftId: gift.id,
    senderUserId: params.senderUserId,
    recipientUserId: params.recipientUserId,
    coinsSpent: gift.coinCost,
    createdAt: new Date(),
    messageId: params.messageId
  }
  try {
    const db = await getMongoDb()
    const collection = db.collection<SentGiftRecord>('gift_sends')
    await collection.insertOne(record as any)
  } catch {
    inMemoryGifts.push(record)
  }
  return record
}

export async function listSentGiftsForUser(userId: string) {
  try {
    const db = await getMongoDb()
    const collection = db.collection<SentGiftRecord>('gift_sends')
    const rows = await collection.find({ senderUserId: userId }).sort({ createdAt: -1 }).limit(100).toArray()
    return rows
  } catch {
    return inMemoryGifts.filter(g => g.senderUserId === userId).slice(-100).reverse()
  }
}

export async function listReceivedGiftsForUser(userId: string) {
  try {
    const db = await getMongoDb()
    const collection = db.collection<SentGiftRecord>('gift_sends')
    const rows = await collection.find({ recipientUserId: userId }).sort({ createdAt: -1 }).limit(100).toArray()
    return rows
  } catch {
    return inMemoryGifts.filter(g => g.recipientUserId === userId).slice(-100).reverse()
  }
}
