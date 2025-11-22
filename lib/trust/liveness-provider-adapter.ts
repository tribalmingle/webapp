import type { LivenessSessionDocument } from '@/lib/data/types'

export class MissingLivenessProviderEndpointError extends Error {
  constructor() {
    super('Liveness provider endpoint not configured')
    this.name = 'MissingLivenessProviderEndpointError'
  }
}

export class LivenessProviderRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LivenessProviderRequestError'
  }
}

export type ProviderRequestPayload = {
  sessionToken: string
  intent: LivenessSessionDocument['intent']
  locale: string
  memberId: string
  artifacts: NonNullable<LivenessSessionDocument['artifacts']>
}

export type ProviderRequestResult = {
  providerSessionId?: string
  status: 'queued'
  rawResponse?: unknown
}

export async function requestProviderReview(payload: ProviderRequestPayload): Promise<ProviderRequestResult> {
  const endpoint = process.env.LIVENESS_PROVIDER_ENDPOINT

  if (!endpoint) {
    throw new MissingLivenessProviderEndpointError()
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new LivenessProviderRequestError(`Provider responded with status ${response.status}`)
  }

  const body = await safeJson(response)
  return {
    providerSessionId: typeof body?.sessionId === 'string' ? body.sessionId : undefined,
    status: 'queued',
    rawResponse: body,
  }
}

function buildHeaders() {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  }

  if (process.env.LIVENESS_PROVIDER_API_KEY) {
    headers['x-api-key'] = process.env.LIVENESS_PROVIDER_API_KEY
  }

  return headers
}

async function safeJson(response: Response) {
  try {
    return await response.json()
  } catch (error) {
    return null
  }
}
