import { NextRequest } from 'next/server'

export interface AuthUser {
  userId: string
  name?: string
  roles?: string[]
  isPremium?: boolean
  trustScore?: number
}

/**
 * getAuthUser
 * Temporary Phase 8 stub. In production this would:
 * 1. Parse cookies / Authorization bearer token
 * 2. Decode JWT/session and validate signature
 * 3. Fetch user record & roles/entitlements
 * 4. Enforce revocation / trust checks
 * Returns null when unauthenticated.
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      // Dev fallback: allow a synthetic user for now
      return {
        userId: 'dev-user',
        name: 'Dev User',
        roles: ['user'],
        isPremium: true,
        trustScore: 0.85,
      }
    }

    const token = authHeader.replace(/^[Bb]earer\s+/,'').trim()
    if (!token) return null

    // Minimal token parsing (stub). A real implementation would verify JWT.
    // Accept tokens of form demo:<userId>:<name>
    if (token.startsWith('demo:')) {
      const parts = token.split(':')
      const userId = parts[1] || 'guest'
      const name = parts[2] || 'Guest'
      return {
        userId,
        name,
        roles: ['user'],
        isPremium: false,
        trustScore: 0.5,
      }
    }

    // Unknown token format: treat as unauthenticated for now
    return null
  } catch {
    return null
  }
}
