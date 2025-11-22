import type { LivenessSessionDocument } from '@/lib/data/types'
import { trackServerEvent } from '@/lib/analytics/segment'
import { createTrustEvent } from '@/lib/trust/trust-event-service'

import { MissingLivenessProviderEndpointError, requestProviderReview } from './liveness-provider-adapter'

export type DispatchLivenessProviderInput = {
  session: LivenessSessionDocument
  artifacts: NonNullable<LivenessSessionDocument['artifacts']>
}

export async function dispatchLivenessProviderCheck({ session, artifacts }: DispatchLivenessProviderInput) {
  try {
    const result = await requestProviderReview({
      sessionToken: session.sessionToken,
      intent: session.intent,
      locale: session.locale,
      memberId: session.memberId.toString(),
      artifacts,
    })

    await trackServerEvent({
      userId: session.memberId.toString(),
      event: 'liveness.provider.dispatch',
      properties: {
        sessionToken: session.sessionToken,
        providerSessionId: result.providerSessionId,
        locale: session.locale,
        intent: session.intent,
        status: result.status,
      },
    })

    return { mode: 'provider', providerSessionId: result.providerSessionId }
  } catch (error) {
    await handleDispatchFailure(error, session)
    return { mode: 'manual-review' as const }
  }
}

async function handleDispatchFailure(error: unknown, session: LivenessSessionDocument) {
  if (!(error instanceof MissingLivenessProviderEndpointError)) {
    console.error('[liveness] provider dispatch failed', error)
  }

  await createTrustEvent({
    userId: session.memberId,
    eventType: 'liveness_manual_check',
    source: 'system',
    context: {
      sessionToken: session.sessionToken,
      locale: session.locale,
      intent: session.intent,
      reason: error instanceof MissingLivenessProviderEndpointError ? 'provider_unconfigured' : 'provider_failed',
    },
    relatedIds: session._id ? [session._id] : undefined,
  })

  await trackServerEvent({
    userId: session.memberId.toString(),
    event: 'liveness.provider.dispatch',
    properties: {
      sessionToken: session.sessionToken,
      fallback: true,
      error: error instanceof Error ? error.message : 'unknown_error',
    },
  })
}
