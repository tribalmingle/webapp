import { NextRequest, NextResponse } from 'next/server'

import { finishPasskeyRegistration } from '@/lib/services/onboarding-auth-service'

const PASSKEY_CHALLENGE_COOKIE = 'tm_passkey_challenge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, prospectId, attestation } = body ?? {}

    if (!email || !prospectId || !attestation) {
      return NextResponse.json({ error: 'Email, prospectId, and attestation payload are required' }, { status: 400 })
    }

    const challenge = req.cookies.get(PASSKEY_CHALLENGE_COOKIE)?.value

    const result = await finishPasskeyRegistration(email, prospectId, challenge, attestation)

    const response = NextResponse.json(result)
    response.cookies.delete(PASSKEY_CHALLENGE_COOKIE)
    return response
  } catch (error) {
    console.error('[passkey:register] Failed to complete registration', error)
    return NextResponse.json({ error: 'Failed to complete passkey enrollment' }, { status: 500 })
  }
}
