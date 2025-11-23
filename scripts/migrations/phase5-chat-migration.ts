/**
 * Phase 5 Chat Collections Migration
 * Adds indexes and schema updates for chat_messages and chat_threads
 */

import { getMongoDb } from '@/lib/mongodb'

export async function migrateChatCollections() {
  const db = await getMongoDb()
  
  console.log('[Migration] Starting Phase 5 chat collections migration...')

  // === MESSAGES COLLECTION ===
  const messages = db.collection('messages')
  
  // Add indexes for Phase 5 features
  await messages.createIndex({ senderId: 1, createdAt: -1 })
  await messages.createIndex({ receiverId: 1, createdAt: -1 })
  await messages.createIndex({ threadId: 1, createdAt: -1 })
  await messages.createIndex({ status: 1 })
  await messages.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index for disappearing messages
  await messages.createIndex({ 'attachments.moderationStatus': 1 })
  await messages.createIndex({ 'safetyFlags.riskScore': 1 })
  
  console.log('[Migration] ✓ Messages collection indexes created')

  // Backfill existing messages with default Phase 5 fields
  const messagesUpdated = await messages.updateMany(
    { 
      $or: [
        { status: { $exists: false } },
        { type: { $exists: false } }
      ]
    },
    { 
      $set: { 
        status: 'sent',
        type: 'text',
        updatedAt: new Date()
      } 
    }
  )
  
  console.log(`[Migration] ✓ Backfilled ${messagesUpdated.modifiedCount} messages with defaults`)

  // === CHAT_THREADS COLLECTION ===
  const chatThreads = db.collection('chat_threads')
  
  // Add indexes
  await chatThreads.createIndex({ participantIds: 1 })
  await chatThreads.createIndex({ lastMessageAt: -1 })
  await chatThreads.createIndex({ folder: 1 })
  await chatThreads.createIndex({ snoozedUntil: 1 })
  
  console.log('[Migration] ✓ Chat threads collection indexes created')

  // Backfill threads with folder assignment
  const threadsUpdated = await chatThreads.updateMany(
    { folder: { $exists: false } },
    { $set: { folder: 'active', updatedAt: new Date() } }
  )
  
  console.log(`[Migration] ✓ Backfilled ${threadsUpdated.modifiedCount} threads with folder='active'`)

  console.log('[Migration] Phase 5 chat collections migration complete!')
  
  return {
    messagesIndexes: 7,
    messagesBackfilled: messagesUpdated.modifiedCount,
    threadsIndexes: 4,
    threadsBackfilled: threadsUpdated.modifiedCount,
  }
}

// Run if called directly
if (require.main === module) {
  migrateChatCollections()
    .then((result) => {
      console.log('Migration result:', result)
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}
