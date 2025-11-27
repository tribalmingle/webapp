/**
 * Security Headers Middleware
 * Implements comprehensive security headers for production deployment
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Security headers configuration
 */
export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string | boolean
  strictTransportSecurity?: string | boolean
  xFrameOptions?: string
  xContentTypeOptions?: string
  referrerPolicy?: string
  permissionsPolicy?: string
  crossOriginEmbedderPolicy?: string
  crossOriginOpenerPolicy?: string
  crossOriginResourcePolicy?: string
}

/**
 * Default CSP directives for production
 */
const DEFAULT_CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Next.js requires inline scripts
    "'unsafe-eval'", // Required for development, remove in production
    'https://cdn.jsdelivr.net', // For external libraries
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for styled-components/CSS-in-JS
    'https://fonts.googleapis.com',
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:', // Allow images from any HTTPS source
  ],
  'media-src': [
    "'self'",
    'https:', // Allow media from any HTTPS source
  ],
  'connect-src': [
    "'self'",
    'https://api.tribalmingle.com',
    'https://*.livekit.cloud', // LiveKit WebRTC
    'wss://*.livekit.cloud',
    'https://api.braze.com',
    'https://www.google-analytics.com',
  ],
  'frame-src': [
    "'self'",
    'https://www.youtube.com', // Embedded videos
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'upgrade-insecure-requests': [],
}

/**
 * Build CSP header string from directives
 */
function buildCSP(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key
      }
      return `${key} ${values.join(' ')}`
    })
    .join('; ')
}

/**
 * Default security headers
 */
const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  contentSecurityPolicy: true,
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: [
    'geolocation=(self)',
    'camera=(self)',
    'microphone=(self)',
    'payment=(self)',
  ].join(', '),
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: NextResponse,
  config: SecurityHeadersConfig = DEFAULT_SECURITY_HEADERS
): NextResponse {
  // Content Security Policy
  if (config.contentSecurityPolicy) {
    const csp = typeof config.contentSecurityPolicy === 'string'
      ? config.contentSecurityPolicy
      : buildCSP(DEFAULT_CSP_DIRECTIVES)
    response.headers.set('Content-Security-Policy', csp)
  }
  
  // HTTP Strict Transport Security
  if (config.strictTransportSecurity) {
    response.headers.set(
      'Strict-Transport-Security',
      typeof config.strictTransportSecurity === 'string'
        ? config.strictTransportSecurity
        : DEFAULT_SECURITY_HEADERS.strictTransportSecurity as string
    )
  }
  
  // X-Frame-Options (prevent clickjacking)
  if (config.xFrameOptions) {
    response.headers.set('X-Frame-Options', config.xFrameOptions)
  }
  
  // X-Content-Type-Options (prevent MIME sniffing)
  if (config.xContentTypeOptions) {
    response.headers.set('X-Content-Type-Options', config.xContentTypeOptions)
  }
  
  // Referrer-Policy
  if (config.referrerPolicy) {
    response.headers.set('Referrer-Policy', config.referrerPolicy)
  }
  
  // Permissions-Policy
  if (config.permissionsPolicy) {
    response.headers.set('Permissions-Policy', config.permissionsPolicy)
  }
  
  // Cross-Origin headers
  if (config.crossOriginEmbedderPolicy) {
    response.headers.set('Cross-Origin-Embedder-Policy', config.crossOriginEmbedderPolicy)
  }
  
  if (config.crossOriginOpenerPolicy) {
    response.headers.set('Cross-Origin-Opener-Policy', config.crossOriginOpenerPolicy)
  }
  
  if (config.crossOriginResourcePolicy) {
    response.headers.set('Cross-Origin-Resource-Policy', config.crossOriginResourcePolicy)
  }
  
  // Additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  return response
}

/**
 * Middleware wrapper to apply security headers
 */
export function withSecurityHeaders(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  config?: SecurityHeadersConfig
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const response = await handler(request, context)
    return applySecurityHeaders(response, config)
  }
}

/**
 * Get security headers as an object for Next.js config
 */
export function getSecurityHeadersConfig(): Array<{ key: string; value: string }> {
  const csp = buildCSP(DEFAULT_CSP_DIRECTIVES)
  
  return [
    {
      key: 'Content-Security-Policy',
      value: csp,
    },
    {
      key: 'Strict-Transport-Security',
      value: DEFAULT_SECURITY_HEADERS.strictTransportSecurity as string,
    },
    {
      key: 'X-Frame-Options',
      value: DEFAULT_SECURITY_HEADERS.xFrameOptions as string,
    },
    {
      key: 'X-Content-Type-Options',
      value: DEFAULT_SECURITY_HEADERS.xContentTypeOptions as string,
    },
    {
      key: 'Referrer-Policy',
      value: DEFAULT_SECURITY_HEADERS.referrerPolicy as string,
    },
    {
      key: 'Permissions-Policy',
      value: DEFAULT_SECURITY_HEADERS.permissionsPolicy as string,
    },
    {
      key: 'X-DNS-Prefetch-Control',
      value: 'on',
    },
    {
      key: 'X-XSS-Protection',
      value: '1; mode=block',
    },
  ]
}

/**
 * Environment-specific CSP
 */
export function getCSPForEnvironment(env: 'development' | 'staging' | 'production'): string {
  const directives = { ...DEFAULT_CSP_DIRECTIVES }
  
  if (env === 'development') {
    // Allow localhost and webpack dev server
    directives['connect-src'].push('http://localhost:*', 'ws://localhost:*')
    directives['script-src'].push("'unsafe-eval'")
  } else if (env === 'production') {
    // Remove unsafe-eval in production
    directives['script-src'] = directives['script-src'].filter(s => s !== "'unsafe-eval'")
  }
  
  return buildCSP(directives)
}

/**
 * Check if request is secure
 */
export function isSecureRequest(request: NextRequest): boolean {
  // Check if request uses HTTPS
  const proto = request.headers.get('x-forwarded-proto')
  return proto === 'https' || request.nextUrl.protocol === 'https:'
}

/**
 * Enforce HTTPS in production
 */
export function enforceHTTPS(request: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV === 'production' && !isSecureRequest(request)) {
    // Redirect to HTTPS
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }
  return null
}

/**
 * Example usage:
 * 
 * // In API routes
 * export const GET = withSecurityHeaders(
 *   async (request) => {
 *     return NextResponse.json({ data: [] })
 *   }
 * )
 * 
 * // In next.config.js
 * module.exports = {
 *   async headers() {
 *     return [
 *       {
 *         source: '/:path*',
 *         headers: getSecurityHeadersConfig(),
 *       },
 *     ]
 *   },
 * }
 * 
 * // In middleware.ts
 * export function middleware(request: NextRequest) {
 *   // Enforce HTTPS
 *   const httpsRedirect = enforceHTTPS(request)
 *   if (httpsRedirect) return httpsRedirect
 *   
 *   // Continue with request
 *   const response = NextResponse.next()
 *   return applySecurityHeaders(response)
 * }
 */
