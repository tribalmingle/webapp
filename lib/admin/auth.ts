import { NextRequest, NextResponse } from 'next/server'

export interface AdminSessionPayload {
  email: string
  role: 'superadmin' | 'analyst'
  issuedAt: number
}

const ADMIN_COOKIE = 'admin-auth'

export function serializeAdminSession(session: AdminSessionPayload): string {
  return Buffer.from(JSON.stringify(session)).toString('base64url')
}

export function parseAdminSession(raw?: string | null): AdminSessionPayload | null {
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')) as AdminSessionPayload
    if (!parsed.email || !parsed.role) {
      return null
    }
    return parsed
  } catch (error) {
    console.error('Failed to parse admin session', error)
    return null
  }
}

export function getAdminSessionFromRequest(request: NextRequest): AdminSessionPayload | null {
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value
  return parseAdminSession(cookie)
}

export function clearAdminSessionCookie(): { name: string; value: string; options: { maxAge: number; path: string } } {
  return {
    name: ADMIN_COOKIE,
    value: '',
    options: {
      maxAge: -1,
      path: '/',
    },
  }
}

export function buildAdminCookie(session: AdminSessionPayload) {
  return {
    name: ADMIN_COOKIE,
    value: serializeAdminSession(session),
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 8,
      path: '/',
    },
  }
}

interface EnsureAdminOptions {
  roles?: AdminSessionPayload['role'][]
}

type EnsureAdminResult =
  | { session: AdminSessionPayload }
  | { response: NextResponse }

export function ensureAdminRequest(request: NextRequest, options: EnsureAdminOptions = {}): EnsureAdminResult {
  const session = getAdminSessionFromRequest(request)

  if (!session) {
    return {
      response: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }),
    }
  }

  if (options.roles && !options.roles.includes(session.role)) {
    return {
      response: NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 }),
    }
  }

  return { session }
}
