import { NextRequest, NextResponse } from 'next/server'
import { removeAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await removeAuthCookie()

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    response.cookies.delete('auth-token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to logout' },
      { status: 500 }
    )
  }
}
