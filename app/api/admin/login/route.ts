import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

import { buildAdminCookie } from '@/lib/admin/auth'

// Admin credentials (in production, this should be in a database)
const ADMIN_EMAIL = 'profmendel@gmail.com'
const ADMIN_PASSWORD_HASH = '$2b$10$Tqk2qf2eZKLiHtv5DQNJDerkrFJVMxp7Q.POzcMaO4xtLBIpc5ebW' // Gig@50chinedu

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if email matches admin email
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const sessionPayload = {
      email: ADMIN_EMAIL,
      role: 'superadmin' as const,
      issuedAt: Date.now(),
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      admin: sessionPayload,
    })

    const cookie = buildAdminCookie(sessionPayload)
    response.cookies.set(cookie.name, cookie.value, cookie.options)

    return response
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    )
  }
}
