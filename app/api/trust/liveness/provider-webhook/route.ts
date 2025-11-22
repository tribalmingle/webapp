import { NextResponse } from 'next/server'
import { z } from 'zod'

import { trackServerEvent } from '@/lib/analytics/segment'
import { applyProviderDecision, getLivenessSessionByToken, incrementWebhookAttempt } from '@/lib/trust/liveness-session-service'
import { createTrustEvent } from '@/lib/trust/trust-event-service'

const providerPayloadSchema = z.object({
  sessionToken: z.string().min(8),
  provider: z.string().default('external'),
  providerSessionId: z.string().optional(),
  decision: z.enum(['pass', 'fail', 'fallback']),
  confidence: z.number().min(0).max(1).optional(),
  reasons: z.array(z.string()).optional(),
  signature: z.string().optional(),
})

export async function POST(request: Request) {
  const rawBody = await safeJson(request)
  const parsed = providerPayloadSchema.safeParse(rawBody ?? {})

  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const session = await getLivenessSessionByToken(parsed.data.sessionToken)

  if (!session) {
    return NextResponse.json({ success: false, message: 'Session not found' }, { status: 404 })
  }

  await incrementWebhookAttempt(parsed.data.sessionToken)

  const updated = await applyProviderDecision({
    sessionToken: parsed.data.sessionToken,
    provider: parsed.data.provider,
    providerSessionId: parsed.data.providerSessionId,
    decision: parsed.data.decision,
    confidence: parsed.data.confidence,
    reasons: parsed.data.reasons,
  })

  await trackServerEvent({
    userId: String(session.memberId),
    event: 'liveness.provider.decision',
    properties: {
      sessionToken: parsed.data.sessionToken,
      provider: parsed.data.provider,
      providerSessionId: parsed.data.providerSessionId,
      decision: parsed.data.decision,
      confidence: parsed.data.confidence,
      reasons: parsed.data.reasons,
      status: updated?.status,
      intent: session.intent,
      device: session.device,
      locale: session.locale,
    },
  })

  if (parsed.data.decision === 'fallback') {
    await createTrustEvent({
      userId: session.memberId,
      eventType: 'liveness_manual_check',
      source: 'system',
      context: {
        sessionToken: parsed.data.sessionToken,
        provider: parsed.data.provider,
        providerSessionId: parsed.data.providerSessionId,
        reasons: parsed.data.reasons,
      },
      relatedIds: session._id ? [session._id] : undefined,
    })
  }

  return NextResponse.json({
    success: true,
    sessionToken: parsed.data.sessionToken,
    status: updated?.status,
    providerDecision: updated?.provider,
  })
}

async function safeJson(request: Request) {
  try {
    return await request.json()
  } catch (error) {
    return {}
  }
}
