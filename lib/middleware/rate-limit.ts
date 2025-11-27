/**
 * Rate Limiting Middleware
 * Implements token bucket algorithm with Redis for distributed rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRedis } from '@/lib/redis/client'

/**
 * Rate limit tier with specific limits
 */
export interface RateLimitTier {
  name: string
  requestsPerMinute: number
  requestsPerHour: number
  requestsPerDay: number
  burstSize?: number
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  tier: RateLimitTier
  keyPrefix: string
  skipSuccessfulRequests?: boolean
  blockDuration?: number
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  reset: Date
  retryAfter?: number
}

/**
 * Default rate limit tiers
 */
export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  FREE: {
    name: 'free',
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstSize: 20,
  },
  PREMIUM: {
    name: 'premium',
    requestsPerMinute: 1000,
    requestsPerHour: 10000,
    requestsPerDay: 100000,
    burstSize: 100,
  },
  ADMIN: {
    name: 'admin',
    requestsPerMinute: 5000,
    requestsPerHour: 50000,
    requestsPerDay: 500000,
    burstSize: 500,
  },
  WEBHOOK: {
    name: 'webhook',
    requestsPerMinute: 100,
    requestsPerHour: 1000,
    requestsPerDay: 10000,
    burstSize: 50,
  },
}

/**
 * Get rate limit key for a request
 */
function getRateLimitKey(prefix: string, identifier: string, window: 'minute' | 'hour' | 'day'): string {
  const now = new Date()
  let windowKey: string
  
  switch (window) {
    case 'minute':
      windowKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}-${now.getUTCHours()}-${now.getUTCMinutes()}`
      break
    case 'hour':
      windowKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}-${now.getUTCHours()}`
      break
    case 'day':
      windowKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`
      break
  }
  
  return `ratelimit:${prefix}:${identifier}:${window}:${windowKey}`
}

/**
 * Get window expiry in seconds
 */
function getWindowExpiry(window: 'minute' | 'hour' | 'day'): number {
  switch (window) {
    case 'minute':
      return 120 // 2 minutes to handle edge cases
    case 'hour':
      return 7200 // 2 hours
    case 'day':
      return 172800 // 2 days
  }
}

/**
 * Calculate reset time for a window
 */
function getResetTime(window: 'minute' | 'hour' | 'day'): Date {
  const now = new Date()
  const reset = new Date(now)
  
  switch (window) {
    case 'minute':
      reset.setUTCSeconds(0, 0)
      reset.setUTCMinutes(reset.getUTCMinutes() + 1)
      break
    case 'hour':
      reset.setUTCMinutes(0, 0, 0)
      reset.setUTCHours(reset.getUTCHours() + 1)
      break
    case 'day':
      reset.setUTCHours(0, 0, 0, 0)
      reset.setUTCDate(reset.getUTCDate() + 1)
      break
  }
  
  return reset
}

/**
 * Check rate limit using token bucket algorithm
 */
async function checkRateLimit(
  identifier: string,
  limit: number,
  window: 'minute' | 'hour' | 'day',
  prefix: string
): Promise<RateLimitResult> {
  const redis = getRedis()
  const key = getRateLimitKey(prefix, identifier, window)
  const reset = getResetTime(window)
  
  if (!redis) {
    // Redis not available, allow request (fail open)
    return {
      allowed: true,
      limit,
      remaining: limit,
      reset,
    }
  }
  
  try {
    // Get current count
    const current = await redis.get(key)
    const count = current ? parseInt(current, 10) : 0
    
    if (count >= limit) {
      // Rate limit exceeded
      const ttl = await redis.ttl(key)
      return {
        allowed: false,
        limit,
        remaining: 0,
        reset,
        retryAfter: ttl > 0 ? ttl : getWindowExpiry(window),
      }
    }
    
    // Increment counter
    const newCount = await redis.incr(key)
    
    // Set expiry if this is the first request in the window
    if (newCount === 1) {
      await redis.expire(key, getWindowExpiry(window))
    }
    
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - newCount),
      reset,
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // On error, allow the request (fail open)
    return {
      allowed: true,
      limit,
      remaining: limit,
      reset,
    }
  }
}

/**
 * Check all rate limits for a request
 */
async function checkAllLimits(
  identifier: string,
  tier: RateLimitTier,
  prefix: string
): Promise<RateLimitResult> {
  // Check limits in order of strictness
  const minuteResult = await checkRateLimit(identifier, tier.requestsPerMinute, 'minute', prefix)
  if (!minuteResult.allowed) {
    return minuteResult
  }
  
  const hourResult = await checkRateLimit(identifier, tier.requestsPerHour, 'hour', prefix)
  if (!hourResult.allowed) {
    return hourResult
  }
  
  const dayResult = await checkRateLimit(identifier, tier.requestsPerDay, 'day', prefix)
  return dayResult
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get user ID from header (if authenticated)
  const userId = request.headers.get('x-user-id')
  if (userId) {
    return `user:${userId}`
  }
  
  // Fall back to IP address
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') ||
             'unknown'
  
  return `ip:${ip}`
}

/**
 * Create rate limit exceeded response
 */
function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const response = NextResponse.json(
    {
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter,
    },
    { status: 429 }
  )
  
  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toISOString())
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString())
  }
  
  return response
}

/**
 * Add rate limit headers to response
 */
function addRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString())
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
  response.headers.set('X-RateLimit-Reset', result.reset.toISOString())
  return response
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: true; result: RateLimitResult } | { allowed: false; response: NextResponse }> {
  const identifier = getClientIdentifier(request)
  const result = await checkAllLimits(identifier, config.tier, config.keyPrefix)
  
  if (!result.allowed) {
    return {
      allowed: false,
      response: createRateLimitResponse(result),
    }
  }
  
  return {
    allowed: true,
    result,
  }
}

/**
 * Decorator for wrapping API routes with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const limitCheck = await rateLimit(request, config)
    
    if (!limitCheck.allowed) {
      return limitCheck.response
    }
    
    const response = await handler(request, context)
    
    // Add rate limit headers to successful responses
    return addRateLimitHeaders(response, limitCheck.result)
  }
}

/**
 * Quick helpers for common rate limits
 */

export async function rateLimitFree(request: NextRequest, prefix = 'api') {
  return rateLimit(request, {
    tier: RATE_LIMIT_TIERS.FREE,
    keyPrefix: prefix,
  })
}

export async function rateLimitPremium(request: NextRequest, prefix = 'api') {
  return rateLimit(request, {
    tier: RATE_LIMIT_TIERS.PREMIUM,
    keyPrefix: prefix,
  })
}

export async function rateLimitAdmin(request: NextRequest, prefix = 'admin') {
  return rateLimit(request, {
    tier: RATE_LIMIT_TIERS.ADMIN,
    keyPrefix: prefix,
  })
}

export async function rateLimitWebhook(request: NextRequest, prefix = 'webhook') {
  return rateLimit(request, {
    tier: RATE_LIMIT_TIERS.WEBHOOK,
    keyPrefix: prefix,
  })
}

/**
 * IP-based blocking for DDoS protection
 */
export async function blockIP(ip: string, duration: number): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  
  const key = `blocked:ip:${ip}`
  await redis.setex(key, duration, '1')
}

export async function isIPBlocked(ip: string): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return false
  
  const key = `blocked:ip:${ip}`
  const blocked = await redis.get(key)
  return blocked === '1'
}

export async function unblockIP(ip: string): Promise<void> {
  const redis = getRedis()
  if (!redis) return
  
  const key = `blocked:ip:${ip}`
  await redis.del(key)
}

/**
 * Check if IP is blocked before processing request
 */
export async function checkIPBlock(request: NextRequest): Promise<boolean> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip')
  
  if (!ip) return false
  
  return isIPBlocked(ip)
}

/**
 * Example usage:
 * 
 * // Using decorator
 * export const GET = withRateLimit(
 *   async (request) => {
 *     return NextResponse.json({ data: [] })
 *   },
 *   {
 *     tier: RATE_LIMIT_TIERS.FREE,
 *     keyPrefix: 'api:users',
 *   }
 * )
 * 
 * // Using direct check
 * export async function POST(request: NextRequest) {
 *   // Check if IP is blocked
 *   const blocked = await checkIPBlock(request)
 *   if (blocked) {
 *     return NextResponse.json({ error: 'Blocked' }, { status: 403 })
 *   }
 *   
 *   // Check rate limit
 *   const limitCheck = await rateLimitFree(request, 'api:signup')
 *   if (!limitCheck.allowed) {
 *     return limitCheck.response
 *   }
 *   
 *   // Process request
 *   const response = NextResponse.json({ success: true })
 *   return addRateLimitHeaders(response, limitCheck.result)
 * }
 * 
 * // Per-user rate limiting
 * export async function POST(request: NextRequest) {
 *   const userId = request.headers.get('x-user-id')
 *   const tier = await getUserTier(userId)
 *   
 *   const limitCheck = await rateLimit(request, {
 *     tier: tier === 'premium' ? RATE_LIMIT_TIERS.PREMIUM : RATE_LIMIT_TIERS.FREE,
 *     keyPrefix: 'api:messages',
 *   })
 *   
 *   if (!limitCheck.allowed) {
 *     return limitCheck.response
 *   }
 *   
 *   // Process message
 * }
 */
