/**
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest'
import { ChatSafetyService } from '@/lib/services/chat-safety-service'

describe('ChatSafetyService', () => {
  describe('scanMessage', () => {
    it('should detect financial information', async () => {
      const nudge = await ChatSafetyService.scanMessage(
        'Send me $500 to my bank account',
        'user-1'
      )

      expect(nudge).not.toBeNull()
      expect(nudge?.type).toBe('financial_info')
      expect(nudge?.severity).toBe('warning')
      expect(nudge?.message).toContain('financial information')
    })

    it('should detect external links', async () => {
      const nudge = await ChatSafetyService.scanMessage(
        'Check out this website: https://example.com',
        'user-1'
      )

      expect(nudge).not.toBeNull()
      expect(nudge?.type).toBe('external_link')
      expect(nudge?.severity).toBe('info')
    })

    it('should detect rush/pressure tactics', async () => {
      const nudge = await ChatSafetyService.scanMessage(
        'I need money urgently! Please help right now!',
        'user-1'
      )

      expect(nudge).not.toBeNull()
      expect(nudge?.type).toBe('rush_pressure')
      expect(nudge?.severity).toBe('warning')
    })

    it('should return null for safe messages', async () => {
      const nudge = await ChatSafetyService.scanMessage(
        'Hey, how was your day?',
        'user-1'
      )

      expect(nudge).toBeNull()
    })

    it('should provide action URL for flagged content', async () => {
      const nudge = await ChatSafetyService.scanMessage(
        'Send $100 to my PayPal account',
        'user-1'
      )

      expect(nudge?.action).toBeDefined()
      expect(nudge?.action?.label).toBeDefined()
      expect(nudge?.action?.url).toBeDefined()
    })
  })

  describe('getSafetyNudgeForDisplay', () => {
    it('should return correct styling for info severity', () => {
      const style = ChatSafetyService.getSafetyNudgeForDisplay({
        severity: 'info',
        type: 'external_link',
        message: 'Test message',
      })

      expect(style.icon).toBe('ℹ️')
      expect(style.bgColor).toContain('blue')
    })

    it('should return correct styling for warning severity', () => {
      const style = ChatSafetyService.getSafetyNudgeForDisplay({
        severity: 'warning',
        type: 'financial_info',
        message: 'Test message',
      })

      expect(style.icon).toBe('⚠️')
      expect(style.bgColor).toContain('yellow')
    })

    it('should return correct styling for critical severity', () => {
      const style = ChatSafetyService.getSafetyNudgeForDisplay({
        severity: 'critical',
        type: 'identity_verification',
        message: 'Test message',
      })

      expect(style.icon).toBe('🛑')
      expect(style.bgColor).toContain('red')
    })
  })

  describe('moderateAttachments', () => {
    it('should auto-approve low-risk attachments', async () => {
      const result = await ChatSafetyService.moderateAttachments({
        messageId: 'msg-1',
        content: 'Check out this photo',
        attachments: [
          { type: 'image', s3Key: 'images/photo.jpg' },
        ],
        userId: 'user-1',
      })

      expect(result.approved).toBe(true)
      expect(result.riskScore).toBeLessThan(0.7)
    })

    it('should flag high-risk attachments for review', async () => {
      const result = await ChatSafetyService.moderateAttachments({
        messageId: 'msg-2',
        content: 'Suspicious content',
        attachments: [
          { type: 'video', s3Key: 'videos/suspicious.mp4' },
          { type: 'audio', s3Key: 'audio/voice.webm' },
          { type: 'image', s3Key: 'images/photo.jpg' },
        ],
        userId: 'user-1',
      })

      expect(result.reviewRequired).toBe(true)
      expect(result.riskScore).toBeGreaterThan(0)
    })
  })
})
