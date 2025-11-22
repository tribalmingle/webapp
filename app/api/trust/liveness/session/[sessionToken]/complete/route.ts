import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { markSessionAwaitingProvider } from '@/lib/trust/liveness-session-service'
import { trackServerEvent } from '@/lib/analytics/segment'
import { dispatchLivenessProviderCheck } from '@/lib/trust/liveness-provider-dispatcher'

const artifactsSchema = z.object({
  photoKey: z.string().min(4),
  videoKey: z.string().min(4),
  idFrontKey: z.string().min(4).optional(),
  idBackKey: z.string().min(4).optional(),
})

const metricsSchema = z.object({
  brightness: z.number().optional(),
  faceMatches: z.number().optional(),
  numAttempts: z.number().int().nonnegative().optional(),
  deviceMotionScore: z.number().optional(),
})

const completeSessionSchema = z.object({
  artifacts: artifactsSchema,
  metrics: metricsSchema.optional(),
  incrementRetry: z.boolean().optional(),
})

type RouteParams = {
  params: Promise<{ sessionToken: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
  }

  const { sessionToken } = await params

  const rawBody = await safeJson(request)
  const parsed = completeSessionSchema.safeParse(rawBody ?? {})

  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const session = await markSessionAwaitingProvider({
      sessionToken,
      memberId: authUser.userId,
      artifacts: parsed.data.artifacts,
      metrics: parsed.data.metrics,
      incrementRetry: parsed.data.incrementRetry,
    })

    if (!session) {
      return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 })
    }

    await trackServerEvent({
      userId: authUser.userId,
      event: 'liveness.session.completed',
      properties: {
        sessionToken,
        status: session.status,
        providerDecision: session.provider?.decision,
        retryCount: session.retryCount,
        metrics: parsed.data.metrics,
      },
    })

    if (session.status === 'awaiting_provider' && session.artifacts) {
      await dispatchLivenessProviderCheck({ session, artifacts: session.artifacts })
    }

    return NextResponse.json({
      success: true,
      status: session.status,
      sessionToken: session.sessionToken,
      providerState: session.provider,
      retryCount: session.retryCount,
    })
  } catch (error) {
    console.error('[liveness] completion failed', error)
    return NextResponse.json({ success: false, message: 'Unable to complete session' }, { status: 500 })
  }
}

async function safeJson(request: Request) {
  try {
    return await request.json()
  } catch (error) {
    return {}
  }
}
