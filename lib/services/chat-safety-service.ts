/**
 * Chat Safety Service - Phase 5
 * Handles moderation, safety heuristics, and TrustService integration for chat
 */

import { getMongoDb } from '@/lib/mongodb'
import { withSpan } from '@/lib/observability/tracing'
import { AnalyticsService } from './analytics-service'

export type SafetyNudge = {
  severity: 'info' | 'warning' | 'critical'
  type: 'financial_info' | 'external_link' | 'sensitive_content' | 'rush_pressure' | 'identity_verification'
  message: string
  action?: {
    label: string
    url?: string
  }
}

export type ModerationRequest = {
  messageId: string
  content: string
  attachments?: Array<{
    type: string
    s3Key: string
  }>
  userId: string
}

export type ModerationResult = {
  approved: boolean
  flags: string[]
  riskScore: number
  provider: string
  reviewRequired: boolean
}

export class ChatSafetyService {
  /**
   * Scan message content for safety issues
   */
  static async scanMessage(content: string, userId: string): Promise<SafetyNudge | null> {
    return withSpan('chat.safety.scanMessage', async () => {
      const nudges: SafetyNudge[] = []

      // Financial info detection
      if (this.containsFinancialInfo(content)) {
        nudges.push({
          severity: 'warning',
          type: 'financial_info',
          message: 'Never share financial information like bank details or send money to someone you haven\'t met in person.',
          action: {
            label: 'Safety tips',
            url: '/safety',
          },
        })
      }

      // External link detection
      if (this.containsExternalLink(content)) {
        nudges.push({
          severity: 'info',
          type: 'external_link',
          message: 'Be cautious about clicking external links. Scammers may try to take you off-platform.',
          action: {
            label: 'Learn more',
            url: '/safety#external-links',
          },
        })
      }

      // Rush/pressure tactics
      if (this.containsRushPressure(content)) {
        nudges.push({
          severity: 'warning',
          type: 'rush_pressure',
          message: 'Take your time. Genuine connections don\'t require immediate action or decisions.',
          action: {
            label: 'Report this',
            url: `/report/user/${userId}`,
          },
        })
      }

      // Return highest severity nudge
      if (nudges.length === 0) return null

      const criticalNudge = nudges.find(n => n.severity === 'critical')
      const warningNudge = nudges.find(n => n.severity === 'warning')
      
      return criticalNudge || warningNudge || nudges[0]
    }, { userId })
  }

  /**
   * Moderate message attachments (voice, images, video)
   */
  static async moderateAttachments(request: ModerationRequest): Promise<ModerationResult> {
    return withSpan('chat.safety.moderateAttachments', async () => {
      const flags: string[] = []
      let riskScore = 0

      // Stub moderation (would integrate with Hive/Spectrum/AWS Rekognition)
      // For now, auto-approve with basic checks
      
      if (request.attachments) {
        for (const attachment of request.attachments) {
          // Voice note moderation
          if (attachment.type === 'audio') {
            // Would send to speech-to-text + content moderation
            riskScore += 0.1
          }
          
          // Image/video moderation
          if (attachment.type === 'image' || attachment.type === 'video') {
            // Would send to visual content moderation API
            riskScore += 0.15
          }
        }
      }

      const approved = riskScore < 0.7
      const reviewRequired = riskScore >= 0.5

      // Update message with moderation result
      const db = await getMongoDb()
      await db.collection('messages').updateOne(
        { _id: request.messageId as any },
        {
          $set: {
            'attachments.$[].moderationStatus': approved ? 'approved' : 'pending',
            'safetyFlags.riskScore': riskScore,
            'safetyFlags.flaggedAt': reviewRequired ? new Date() : undefined,
          },
        }
      )

      // Track analytics
      await AnalyticsService.track({
        eventType: 'chat.safety.moderation_completed',
        userId: request.userId,
        properties: {
          messageId: request.messageId,
          approved,
          riskScore,
          flags,
        },
      })

      return {
        approved,
        flags,
        riskScore,
        provider: 'internal', // Would be 'hive', 'spectrum', etc.
        reviewRequired,
      }
    }, { messageId: request.messageId, userId: request.userId })
  }

  /**
   * Get safety nudge for display in conversation
   */
  static getSafetyNudgeForDisplay(nudge: SafetyNudge): {
    icon: string
    bgColor: string
    borderColor: string
    textColor: string
  } {
    const styles = {
      info: {
        icon: 'ℹ️',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
      },
      warning: {
        icon: '⚠️',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-300',
        textColor: 'text-yellow-900',
      },
      critical: {
        icon: '🛑',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-300',
        textColor: 'text-red-900',
      },
    }

    return styles[nudge.severity]
  }

  /**
   * Private helper methods
   */

  private static containsFinancialInfo(content: string): boolean {
    const financialPatterns = [
      /\b(bank|account|routing|swift|iban|paypal|venmo|cashapp|zelle)\b/i,
      /\b\d{9,}\b/, // Long number sequences
      /\$\s*\d+/,
      /money|cash|payment|transfer|wire|send\s+\d+/i,
    ]

    return financialPatterns.some(pattern => pattern.test(content))
  }

  private static containsExternalLink(content: string): boolean {
    const linkPatterns = [
      /https?:\/\//i,
      /www\./i,
      /\.(com|org|net|io|app)\b/i,
    ]

    return linkPatterns.some(pattern => pattern.test(content))
  }

  private static containsRushPressure(content: string): boolean {
    const rushPatterns = [
      /\b(urgent|immediately|right now|hurry|quick|asap)\b/i,
      /\b(emergency|crisis|problem)\b/i,
      /\b(limited time|expires|deadline)\b/i,
    ]

    return rushPatterns.some(pattern => pattern.test(content))
  }
}
