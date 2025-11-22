/**
 * Session Management API
 * POST /api/analytics/session - Start/update session
 */

import { NextRequest, NextResponse } from 'next/server'
import { AnalyticsService } from '@/lib/services/analytics-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, sessionId, entryPage, exitPage } = body

    if (action === 'start') {
      // Start new session
      const deviceInfo = {
        type: request.headers.get('user-agent')?.includes('Mobile') ? 'mobile' as const : 'desktop' as const,
      }

      const newSessionId = await AnalyticsService.startSession({
        entryPage,
        deviceInfo,
      })

      return NextResponse.json({
        success: true,
        sessionId: newSessionId,
      })
    } else if (action === 'end' && sessionId) {
      // End session
      await AnalyticsService.endSession(sessionId, exitPage)

      return NextResponse.json({
        success: true,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error managing session:', error)
    return NextResponse.json(
      { error: 'Failed to manage session' },
      { status: 500 }
    )
  }
}
