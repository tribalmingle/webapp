import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import {
  getPhotoVerificationQueue,
  reviewPhotoVerification,
} from '@/lib/services/moderation-service'

/**
 * GET /api/admin/moderation/photos - Get photo verification queue
 */
export async function GET(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  if (!['superadmin', 'moderator'].includes(auth.session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status') as any
    const assignedTo = searchParams.get('assignedTo') || undefined
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const queue = await getPhotoVerificationQueue({
      status,
      assignedTo,
      page,
      limit,
    })

    return NextResponse.json({
      success: true,
      ...queue,
    })
  } catch (error: any) {
    console.error('Error fetching photo queue:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch queue' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/moderation/photos - Review a photo verification
 */
export async function POST(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  if (!['superadmin', 'moderator'].includes(auth.session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { userId, approved, rejectionReason } = body

    if (!userId || approved === undefined) {
      return NextResponse.json(
        { error: 'userId and approved required' },
        { status: 400 }
      )
    }

    if (!approved && !rejectionReason) {
      return NextResponse.json(
        { error: 'rejectionReason required when rejecting' },
        { status: 400 }
      )
    }

    await reviewPhotoVerification(userId, {
      approved,
      rejectionReason,
      reviewedBy: auth.session.email,
    })

    return NextResponse.json({
      success: true,
      message: approved ? 'Photo approved' : 'Photo rejected',
    })
  } catch (error: any) {
    console.error('Error reviewing photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to review photo' },
      { status: 500 }
    )
  }
}
