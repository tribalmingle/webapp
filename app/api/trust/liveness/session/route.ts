import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getCurrentUser } from '@/lib/auth'
import { DEFAULT_LOCALE, normalizeLocale } from '@/lib/i18n/locales'
import { trackServerEvent } from '@/lib/analytics/segment'
import { createLivenessSession } from '@/lib/trust/liveness-session-service'

const createSessionSchema = z.object({
  intent: z.enum(['onboarding', 'guardian_invite']).default('onboarding'),
  device: z.enum(['web', 'ios', 'android']).default('web'),
  locale: z.string().min(2).max(5).optional(),
  requireDocumentScan: z.boolean().optional(),
})

export async function POST(request: Request) {
  const authUser = await getCurrentUser()

  if (!authUser) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
  }

  const rawBody = await safeJson(request)
  const parsed = createSessionSchema.safeParse(rawBody ?? {})

  if (!parsed.success) {
    return NextResponse.json({ success: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const locale = normalizeLocale(parsed.data.locale || DEFAULT_LOCALE)
    const session = await createLivenessSession({
      memberId: authUser.userId,
      intent: parsed.data.intent,
      device: parsed.data.device,
      locale,
      requireDocumentScan: parsed.data.requireDocumentScan,
    })

    await trackServerEvent({
      userId: authUser.userId,
      event: 'liveness.session.started',
      properties: {
        sessionToken: session.sessionToken,
        locale,
        intent: session.intent,
        device: session.device,
        expiresAt: session.expiresAt?.toISOString(),
        includeDocumentScan: parsed.data.requireDocumentScan,
      },
    })

    return NextResponse.json({
      success: true,
      sessionId: session._id?.toString(),
      sessionToken: session.sessionToken,
      uploadUrls: session.uploadUrls,
      expiresAt: session.expiresAt,
      status: session.status,
    })
  } catch (error) {
    console.error('[liveness] session creation failed', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to create liveness session',
      },
      { status: 500 },
    )
  }
}

async function safeJson(request: Request) {
  try {
    return await request.json()
  } catch (error) {
    return {}
  }
}
