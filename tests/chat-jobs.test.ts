/**
 * Phase 5: Chat Jobs Tests
 * Tests for disappearing messages, recall windows, attachments, and analytics
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  runDisappearingMessagesJob,
  runMessageRecallWindowJob,
  runAttachmentCleanupJob,
  runMessagingAnalyticsJob,
} from '@/lib/jobs/chat-jobs'
import { getMongoDb } from '@/lib/mongodb'

describe('Chat Background Jobs', () => {
  let db: any

  beforeAll(async () => {
    db = await getMongoDb()
    // Clean test data
    await db.collection('messages').deleteMany({ _id: { $regex: /^test-/ } })
    await db.collection('messaging_analytics_snapshots').deleteMany({ date: { $gte: new Date('2020-01-01') } })
  })

  afterAll(async () => {
    await db.collection('messages').deleteMany({ _id: { $regex: /^test-/ } })
    await db.collection('messaging_analytics_snapshots').deleteMany({ date: { $gte: new Date('2020-01-01') } })
  })

  describe('runDisappearingMessagesJob', () => {
    it('should expire messages past their expiry time', async () => {
      const pastExpiry = new Date(Date.now() - 60 * 1000)
      const futureExpiry = new Date(Date.now() + 60 * 60 * 1000)

      await db.collection('messages').insertMany([
        {
          _id: 'test-expired-1',
          content: 'This should expire',
          status: 'sent',
          expiresAt: pastExpiry,
          createdAt: new Date(),
        },
        {
          _id: 'test-expired-2',
          content: 'This should expire too',
          status: 'sent',
          expiresAt: pastExpiry,
          createdAt: new Date(),
        },
        {
          _id: 'test-not-expired',
          content: 'This should remain',
          status: 'sent',
          expiresAt: futureExpiry,
          createdAt: new Date(),
        },
      ])

      const result = await runDisappearingMessagesJob()

      expect(result.deletedCount).toBeGreaterThanOrEqual(2)

      const expired1 = await db.collection('messages').findOne({ _id: 'test-expired-1' })
      const expired2 = await db.collection('messages').findOne({ _id: 'test-expired-2' })
      const notExpired = await db.collection('messages').findOne({ _id: 'test-not-expired' })

      expect(expired1?.status).toBe('expired')
      expect(expired1?.content).toBe('[Message expired]')
      expect(expired1?.attachments).toBeUndefined()

      expect(expired2?.status).toBe('expired')
      expect(notExpired?.status).toBe('sent')
      expect(notExpired?.content).toBe('This should remain')
    })
  })

  describe('runMessageRecallWindowJob', () => {
    it('should close recall windows for messages older than 15 minutes', async () => {
      const now = new Date()
      const oldMessage = new Date(now.getTime() - 20 * 60 * 1000) // 20 mins ago
      const recentMessage = new Date(now.getTime() - 5 * 60 * 1000) // 5 mins ago

      await db.collection('messages').insertMany([
        {
          _id: 'test-recall-old',
          content: 'Old message',
          status: 'sent',
          createdAt: oldMessage,
        },
        {
          _id: 'test-recall-recent',
          content: 'Recent message',
          status: 'sent',
          createdAt: recentMessage,
        },
      ])

      const result = await runMessageRecallWindowJob()

      expect(result.closedCount).toBeGreaterThanOrEqual(1)

      const oldMsg = await db.collection('messages').findOne({ _id: 'test-recall-old' })
      const recentMsg = await db.collection('messages').findOne({ _id: 'test-recall-recent' })

      expect(oldMsg?.recallWindowClosed).toBe(true)
      expect(recentMsg?.recallWindowClosed).toBeUndefined()
    })
  })

  describe('runAttachmentCleanupJob', () => {
    it('should archive old messages with attachments', async () => {
      const now = new Date()
      const oldDate = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000) // 100 days ago

      await db.collection('messages').insertMany([
        {
          _id: 'test-attach-old',
          content: 'Old with attachment',
          createdAt: oldDate,
          attachments: [
            { s3Key: 'test-key-1.jpg', url: 'https://example.com/test.jpg' }
          ],
        },
        {
          _id: 'test-attach-recent',
          content: 'Recent with attachment',
          createdAt: new Date(),
          attachments: [
            { s3Key: 'test-key-2.jpg', url: 'https://example.com/test2.jpg' }
          ],
        },
      ])

      const result = await runAttachmentCleanupJob()

      expect(result.archivedCount).toBeGreaterThanOrEqual(1)
      expect(result.s3KeysToDelete).toContain('test-key-1.jpg')

      const oldMsg = await db.collection('messages').findOne({ _id: 'test-attach-old' })
      const recentMsg = await db.collection('messages').findOne({ _id: 'test-attach-recent' })

      expect(oldMsg?.attachmentsArchived).toBe(true)
      expect(oldMsg?.attachments).toBeUndefined()
      expect(recentMsg?.attachmentsArchived).toBeUndefined()
      expect(recentMsg?.attachments).toBeDefined()
    })
  })

  describe('runMessagingAnalyticsJob', () => {
    it('should create daily analytics snapshot', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(12, 0, 0, 0)

      await db.collection('messages').insertMany([
        {
          _id: 'test-analytics-1',
          type: 'text',
          createdAt: yesterday,
        },
        {
          _id: 'test-analytics-2',
          type: 'voice',
          createdAt: yesterday,
        },
        {
          _id: 'test-analytics-3',
          type: 'text',
          status: 'recalled',
          recalledAt: yesterday,
          createdAt: yesterday,
        },
      ])

      const snapshot = await runMessagingAnalyticsJob()

      expect(snapshot).toBeDefined()
      expect(snapshot.voiceNoteCount).toBeGreaterThanOrEqual(1)
      expect(snapshot.recalledCount).toBeGreaterThanOrEqual(1)

      // Verify snapshot was stored
      const stored = await db.collection('messaging_analytics_snapshots').findOne({
        date: snapshot.date,
      })

      expect(stored).toBeDefined()
      expect(stored?.voiceNoteCount).toBe(snapshot.voiceNoteCount)
    })
  })
})
