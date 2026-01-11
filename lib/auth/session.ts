import { NextRequest } from 'next/server'
import { jwtVerify, SignJWT } from 'jose'

export interface AuthUser {
  userId: string
  name?: string
  email?: string
  roles?: string[]
  isPremium?: boolean
  trustScore?: number
}

// JWT secret key from environment
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tribal-mingle-dev-secret-key-change-in-production'
)

/**
 * Generate JWT access token
 */
export async function generateAccessToken(user: { id: string; email?: string; name?: string; isPremium?: boolean }): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    isPremium: user.isPremium || false
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h') // 1 hour expiration
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify and decode JWT token
 */
export async function verifyAccessToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    
    return {
      userId: payload.userId as string,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      isPremium: payload.isPremium as boolean | undefined,
      roles: payload.roles as string[] | undefined,
      trustScore: payload.trustScore as number | undefined
    }
  } catch (error) {
    console.error('[verifyAccessToken] JWT verification failed:', error)
    return null
  }
}

/**
 * getAuthUser
 * Production-ready JWT verification
 * Parses Authorization header, validates JWT signature, and returns user info
 * Returns null when unauthenticated or token invalid
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    
    // No auth header - check for dev mode fallback
    if (!authHeader) {
      // Dev fallback only in development environment
      if (process.env.NODE_ENV === 'development' && process.env.ALLOW_DEV_AUTH === 'true') {
        return {
          userId: 'dev-user',
          name: 'Dev User',
          email: 'dev@tribalmingle.com',
          roles: ['user'],
          isPremium: true,
          trustScore: 0.85,
        }
      }
      return null
    }

    const token = authHeader.replace(/^[Bb]earer\s+/, '').trim()
    if (!token) return null

    // Handle demo tokens (for development/testing only)
    if (token.startsWith('demo:') && process.env.NODE_ENV === 'development') {
      const parts = token.split(':')
      const userId = parts[1] || 'guest'
      const name = parts[2] || 'Guest'
      return {
        userId,
        name,
        email: `${userId}@demo.local`,
        roles: ['user'],
        isPremium: false,
        trustScore: 0.5,
      }
    }

    // Verify JWT token (production mode)
    const authUser = await verifyAccessToken(token)
    return authUser

  } catch (error) {
    console.error('[getAuthUser] Error:', error)
    return null
  }
}
