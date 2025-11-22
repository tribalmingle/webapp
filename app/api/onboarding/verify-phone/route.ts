import { NextRequest, NextResponse } from 'next/server'

import { confirmVerificationCode, sendVerificationCode } from '@/lib/services/onboarding-auth-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, phone, prospectId } = body ?? {}

    if (!email || !phone) {
      return NextResponse.json({ error: 'Email and phone number are required' }, { status: 400 })
    }

    const result = await sendVerificationCode(email, phone, prospectId)
    return NextResponse.json({ prospectId: result.prospectId, sid: result.sid })
  } catch (error) {
    console.error('[verify-phone] Failed to send verification code', error)
    return NextResponse.json({ error: 'Unable to send verification code' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { prospectId, phone, code } = body ?? {}

    if (!prospectId || !phone || !code) {
      return NextResponse.json({ error: 'prospectId, phone, and code are required' }, { status: 400 })
    }

    const result = await confirmVerificationCode(prospectId, phone, code)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[verify-phone] Failed to confirm verification code', error)
    return NextResponse.json({ error: 'Unable to confirm verification code' }, { status: 500 })
  }
}
