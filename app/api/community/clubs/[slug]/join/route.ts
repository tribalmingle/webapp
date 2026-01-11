import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { CommunityService } from '@/lib/services/community-service'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const user = await getCurrentUser()
  
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    await CommunityService.joinClub(slug, user.userId)
    
    return NextResponse.json({
      success: true,
      message: 'Successfully joined club'
    })

  } catch (error: any) {
    console.error('[community/clubs/join] Error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to join club' },
      { status: 500 }
    )
  }
}
