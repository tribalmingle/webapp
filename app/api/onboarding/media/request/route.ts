import { NextRequest, NextResponse } from 'next/server'

import { requestMediaUpload } from '@/lib/services/onboarding-profile-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, mediaType, contentType, prospectId } = body ?? {}

    if (!email || !mediaType || !contentType) {
      return NextResponse.json({ error: 'email, mediaType, and contentType are required' }, { status: 400 })
    }

    const result = await requestMediaUpload({ email, mediaType, contentType, prospectId })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[media:request] Failed to issue signed upload', error)
    return NextResponse.json({ error: 'Unable to request media upload' }, { status: 500 })
  }
}
