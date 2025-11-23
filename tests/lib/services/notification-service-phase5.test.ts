/**
 * @vitest-environment node
 */

import { describe, it, expect, vi } from 'vitest'
import { NotificationService } from '@/lib/services/notification-service'

// Mock dependencies
vi.mock('@/lib/mongodb', () => ({
  getMongoDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      insertOne: vi.fn(() => ({ insertedId: 'notif-id' })),
      findOne: vi.fn(() => null),
      updateOne: vi.fn(() => ({ modifiedCount: 1 })),
    })),
  })),
}))

vi.mock('@/lib/observability/tracing', () => ({
  withSpan: vi.fn((name, fn) => fn()),
}))

vi.mock('@/lib/vendors/onesignal-client', () => ({
  sendOneSignalNotification: vi.fn(() => Promise.resolve({ status: 'success', id: 'os-123' })),
}))

vi.mock('@/lib/services/analytics-service', () => ({
  AnalyticsService: {
    track: vi.fn(),
  },
}))

describe('NotificationService - Phase 5', () => {
  describe('sendVoiceNoteNotification', () => {
    it('should send voice note notification', async () => {
      const result = await NotificationService.sendVoiceNoteNotification({
        userId: 'user-1',
        senderName: 'John Doe',
        duration: 15,
        messageId: 'msg-123',
      })

      expect(result).toBeDefined()
      expect(result.type).toBe('voice_note_received')
      expect(result.category).toBe('message')
    })

    it('should include sender photo in notification', async () => {
      const result = await NotificationService.sendVoiceNoteNotification({
        userId: 'user-1',
        senderName: 'Jane Smith',
        senderPhoto: 'https://example.com/photo.jpg',
        duration: 20,
        messageId: 'msg-456',
      })

      expect(result.payload.senderPhoto).toBe('https://example.com/photo.jpg')
    })
  })

  describe('sendLiveKitInvite', () => {
    it('should send video call invite notification', async () => {
      const result = await NotificationService.sendLiveKitInvite({
        userId: 'user-1',
        inviterName: 'John Doe',
        roomName: 'room-123',
        roomUrl: 'https://livekit.example.com/room-123',
      })

      expect(result).toBeDefined()
      expect(result.type).toBe('livekit_invite')
      expect(result.category).toBe('call')
      expect(result.priority).toBe('high')
    })

    it('should set urgent priority for video calls', async () => {
      const result = await NotificationService.sendLiveKitInvite({
        userId: 'user-1',
        inviterName: 'Jane Smith',
        roomName: 'room-456',
        roomUrl: 'https://livekit.example.com/room-456',
      })

      expect(result.priority).toBe('high')
    })
  })

  describe('sendSafetyAlert', () => {
    it('should send safety alert notification', async () => {
      const result = await NotificationService.sendSafetyAlert({
        userId: 'user-1',
        alertType: 'suspicious_behavior',
        message: 'We detected suspicious activity on your account',
      })

      expect(result).toBeDefined()
      expect(result.type).toBe('safety_alert')
      expect(result.category).toBe('safety')
      expect(result.priority).toBe('high')
    })

    it('should include action URL when provided', async () => {
      const result = await NotificationService.sendSafetyAlert({
        userId: 'user-1',
        alertType: 'content_flagged',
        message: 'Your content was flagged for review',
        actionUrl: 'https://example.com/review',
      })

      expect(result.payload.deeplink).toBe('https://example.com/review')
    })
  })
})
