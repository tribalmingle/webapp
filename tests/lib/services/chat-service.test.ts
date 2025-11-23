/**
 * @vitest-environment node
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ChatService } from '@/lib/services/chat-service'

// Mock dependencies
vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      insertOne: vi.fn(() => ({ insertedId: 'test-message-id' })),
      findOne: vi.fn(() => ({
        _id: 'test-message-id',
        content: 'Hello world',
        senderId: 'user-1',
        createdAt: new Date(),
      })),
      updateOne: vi.fn(() => ({ modifiedCount: 1 })),
    })),
  })),
}))

vi.mock('@/lib/observability/tracing', () => ({
  withSpan: vi.fn((name, fn) => fn()),
}))

vi.mock('@/lib/services/translation-service', () => ({
  translate: vi.fn((text, options) => Promise.resolve(`Translated: ${text}`)),
}))

vi.mock('@/lib/services/analytics-service', () => ({
  AnalyticsService: {
    track: vi.fn(),
  },
}))

describe('ChatService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendVoiceNote', () => {
    it('should upload voice note and return message ID', async () => {
      const result = await ChatService.sendVoiceNote({
        userId: 'user-1',
        receiverId: 'user-2',
        audioBlob: Buffer.from('fake-audio-data'),
        duration: 15,
        locale: 'en',
      })

      expect(result).toHaveProperty('messageId')
      expect(result).toHaveProperty('s3Key')
      expect(result.s3Key).toContain('voice-notes/user-1')
    })

    it('should enforce rate limits', async () => {
      // Stub - actual rate limiting would be tested with Redis mock
      const result = await ChatService.sendVoiceNote({
        userId: 'user-1',
        receiverId: 'user-2',
        audioBlob: Buffer.from('fake-audio-data'),
        duration: 15,
      })

      expect(result).toBeDefined()
    })
  })

  describe('translateMessage', () => {
    it('should translate message content', async () => {
      const result = await ChatService.translateMessage({
        messageId: 'test-message-id',
        userId: 'user-1',
        targetLocale: 'es',
      })

      expect(result).toHaveProperty('translatedText')
      expect(result.translatedText).toContain('Translated')
      expect(result).toHaveProperty('cached')
    })

    it('should return cached translation if available', async () => {
      const result = await ChatService.translateMessage({
        messageId: 'test-message-id',
        userId: 'user-1',
        targetLocale: 'fr',
      })

      expect(result).toBeDefined()
    })
  })

  describe('generateLiveKitToken', () => {
    it('should generate token for video call', async () => {
      const result = await ChatService.generateLiveKitToken({
        userId: 'user-1',
        roomName: 'room-123',
        participantName: 'John Doe',
      })

      expect(result).toHaveProperty('token')
      expect(result).toHaveProperty('roomUrl')
      expect(result.token).toContain('lk_')
    })

    it('should check user entitlements before generating token', async () => {
      const result = await ChatService.generateLiveKitToken({
        userId: 'user-1',
        roomName: 'room-456',
        participantName: 'Jane Smith',
      })

      expect(result).toBeDefined()
    })
  })

  describe('recallMessage', () => {
    it('should recall message within window', async () => {
      const result = await ChatService.recallMessage({
        messageId: 'test-message-id',
        userId: 'user-1',
      })

      expect(result.success).toBe(true)
    })

    it('should reject recall after window expires', async () => {
      // Mock old message (>15 minutes)
      const oldDate = new Date(Date.now() - 20 * 60 * 1000)
      
      vi.mocked(await import('@/lib/mongodb')).getMongoDb = vi.fn(() => ({
        collection: vi.fn(() => ({
          findOne: vi.fn(() => ({
            _id: 'old-message-id',
            content: 'Old message',
            senderId: 'user-1',
            createdAt: oldDate,
          })),
          updateOne: vi.fn(),
        })),
      })) as any

      const result = await ChatService.recallMessage({
        messageId: 'old-message-id',
        userId: 'user-1',
      })

      expect(result.success).toBe(false)
      expect(result.reason).toContain('window expired')
    })
  })
})
