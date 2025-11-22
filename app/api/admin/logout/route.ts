import { NextResponse } from 'next/server'

import { clearAdminSessionCookie } from '@/lib/admin/auth'

export async function POST() {
  const response = NextResponse.json({ success: true })
  const cookie = clearAdminSessionCookie()
  response.cookies.set(cookie.name, cookie.value, cookie.options)
  return response
}
