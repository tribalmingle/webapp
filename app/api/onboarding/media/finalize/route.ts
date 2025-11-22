import { NextRequest, NextResponse } from 'next/server'

import { finalizeMediaUpload } from '@/lib/services/onboarding-profile-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prospectId, uploadKey, mediaType, aiHints } = body ?? {}

    if (!prospectId || !uploadKey || !mediaType) {
      return NextResponse.json({ error: 'prospectId, uploadKey, and mediaType are required' }, { status: 400 })
    }

    const result = await finalizeMediaUpload({ prospectId, uploadKey, mediaType, aiHints })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[media:finalize] Failed to finalize media upload', error)
    return NextResponse.json({ error: 'Unable to finalize media upload' }, { status: 500 })
  }
}
