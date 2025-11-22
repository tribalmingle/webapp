import { NextResponse } from 'next/server'
import { z } from 'zod'

import { trackServerEvent } from '@/lib/analytics/segment'
import { createGuardianInviteRequest } from '@/lib/trust/guardian-invite-service'
import { DEFAULT_LOCALE, normalizeLocale, SUPPORTED_LOCALES } from '@/lib/i18n/locales'

const requestPayloadSchema = z.object({
  memberName: z.string().trim().min(2).max(140),
  contact: z.string().trim().min(5).max(160),
  context: z.string().trim().max(1000).optional(),
  locale: z.string().trim().optional(),
  regionHint: z.string().trim().max(64).optional(),
})

export async function POST(request: Request) {
  const rawPayload = await parseRequestBody(request)
  const payloadResult = requestPayloadSchema.safeParse(rawPayload)

  if (!payloadResult.success) {
    return NextResponse.json(
      {
        success: false,
        errors: payloadResult.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const normalizedLocale = normalizeLocale(payloadResult.data.locale)
  const locale = SUPPORTED_LOCALES.includes(normalizedLocale) ? normalizedLocale : DEFAULT_LOCALE

  const regionHint = valueOrUndefined(payloadResult.data.regionHint) || inferRegionHint(request.headers)
  const diagnostics = {
    ip: extractClientIp(request.headers),
    userAgent: request.headers.get('user-agent') ?? undefined,
  }

  const inviteRequest = await createGuardianInviteRequest(
    {
      memberName: payloadResult.data.memberName,
      contact: payloadResult.data.contact,
      context: valueOrUndefined(payloadResult.data.context),
      locale,
      regionHint,
      source: 'family_portal_form',
    },
    diagnostics,
  )

  console.info('[guardian-invites] request received', {
    requestId: inviteRequest._id?.toString(),
    locale: inviteRequest.locale,
    regionHint: inviteRequest.regionHint,
  })

  await trackServerEvent({
    userId: inviteRequest._id?.toString() ?? 'guardian-invite',
    event: 'family-portal.invite.submit',
    properties: {
      requestId: inviteRequest._id?.toString(),
      locale: inviteRequest.locale,
      regionHint: inviteRequest.regionHint,
      source: inviteRequest.source,
      hasContext: Boolean(inviteRequest.context?.length),
      channel: detectChannel(inviteRequest.contact),
    },
  })

  return NextResponse.json({
    success: true,
    requestId: inviteRequest._id?.toString(),
    status: inviteRequest.status,
  })
}

async function parseRequestBody(request: Request): Promise<Record<string, string>> {
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const json = await request.json()
    if (json && typeof json === 'object') {
      return Object.fromEntries(
        Object.entries(json as Record<string, unknown>)
          .filter(([, value]) => typeof value === 'string')
          .map(([key, value]) => [key, (value as string).toString()]),
      )
    }
    return {}
  }

  const formData = await request.formData()
  const result: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      result[key] = value
    }
  }
  return result
}

function inferRegionHint(headers: Headers, fallback?: string) {
  return fallback || headers.get('x-vercel-ip-country') || headers.get('cf-ipcountry') || headers.get('x-country') || undefined
}

function extractClientIp(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim()
  }
  return headers.get('x-real-ip') || undefined
}

function valueOrUndefined(value?: string | null) {
  if (!value) return undefined
  return value.length > 0 ? value : undefined
}

function detectChannel(contact: string) {
  if (contact.includes('@')) {
    return 'email'
  }
  if (contact.startsWith('+')) {
    return 'whatsapp'
  }
  return 'unknown'
}
