import { NextRequest, NextResponse } from 'next/server'

import { startPasskeyRegistration } from '@/lib/services/onboarding-auth-service'

const PASSKEY_CHALLENGE_COOKIE = 'tm_passkey_challenge'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, prospectId } = body ?? {}

    if (!email) {
      return NextResponse.json({ error: 'Email is required to start passkey enrollment' }, { status: 400 })
    }

    const { options, prospectId: resolvedProspectId } = await startPasskeyRegistration(email, prospectId)

    const response = NextResponse.json({ options, prospectId: resolvedProspectId })
    response.cookies.set({
      name: PASSKEY_CHALLENGE_COOKIE,
      value: options.challenge,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 5,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })

    return response
  } catch (error) {
    console.error('[passkey:challenge] Failed to generate options', error)
    return NextResponse.json({ error: 'Failed to start passkey enrollment' }, { status: 500 })
  }
}
