import { NextResponse } from 'next/server'
import { z } from 'zod'

import { trackServerEvent } from '@/lib/analytics/segment'
import { getCurrentUser } from '@/lib/auth'
import { appendActivityLog } from '@/lib/trust/activity-log-service'
import { resolveManualReview, type ManualReviewResolution } from '@/lib/trust/liveness-session-service'
import { createTrustEvent } from '@/lib/trust/trust-event-service'

const reviewSchema = z.object({
  resolution: z.enum(['approve', 'reject', 'request_reshoot']),
  note: z.string().min(3).max(500).optional(),
})

type RouteParams = {
  params: Promise<{ sessionToken: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
  }

  if (!userIsReviewer(authUser)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
  }

  const body = await safeJson(request)
  const parsed = reviewSchema.safeParse(body ?? {})

  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { sessionToken } = await params

  try {
    const session = await resolveManualReview({
      sessionToken,
      reviewerId: authUser.userId,
      resolution: parsed.data.resolution as ManualReviewResolution,
      note: parsed.data.note,
    })

    if (!session) {
      return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 })
    }

    await trackServerEvent({
      userId: authUser.userId,
      event: 'liveness.manual.reviewed',
      properties: {
        sessionToken,
        resolution: parsed.data.resolution,
        status: session.status,
        reviewerId: authUser.userId,
      },
    })

    await createTrustEvent({
      userId: session.memberId,
      eventType: 'liveness_manual_decision',
      source: 'system',
      context: {
        sessionToken,
        resolution: parsed.data.resolution,
        reviewerId: authUser.userId,
        note: parsed.data.note,
      },
      relatedIds: session._id ? [session._id] : undefined,
    })

    await appendActivityLog({
      actorId: authUser.userId,
      actorType: 'admin',
      action: 'liveness.manual.reviewed',
      resource: { collection: 'liveness_sessions', id: session._id },
      metadata: {
        resolution: parsed.data.resolution,
        note: parsed.data.note,
        providerDecision: session.provider?.decision,
      },
    })

    return NextResponse.json({
      success: true,
      status: session.status,
      resolution: parsed.data.resolution,
      provider: session.provider,
    })
  } catch (error) {
    console.error('[liveness] manual review failed', error)
    return NextResponse.json({ success: false, message: 'Unable to record review' }, { status: 500 })
  }
}

function userIsReviewer(user: { roles?: string[] | undefined }) {
  if (!Array.isArray(user.roles)) {
    return false
  }
  return user.roles.some((role) => ['admin', 'ops', 'trust'].includes(role))
}

async function safeJson(request: Request) {
  try {
    return await request.json()
  } catch (error) {
    return {}
  }
}
