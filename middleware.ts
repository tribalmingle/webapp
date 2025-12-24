import { NextResponse, type NextRequest } from 'next/server'

import { parseAdminSession } from './lib/admin/auth'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type AppLocale, isSupportedLocale } from './lib/i18n/locales'
import { applySecurityHeaders, enforceHTTPS } from './lib/middleware/security-headers'

const PUBLIC_FILE = /\.(.*)$/
const MARKETING_ENTRY_POINTS = new Set(['/', '/home'])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const httpsRedirect = enforceHTTPS(request)
  if (httpsRedirect) {
    return httpsRedirect
  }

  if (pathname.startsWith('/admin')) {
    if (pathname.startsWith('/admin/login')) {
      return NextResponse.next()
    }

    const adminCookie = request.cookies.get('admin-auth')?.value
    const session = parseAdminSession(adminCookie)

    if (!session) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/admin/login'
      const redirectResponse = NextResponse.redirect(loginUrl)
      return applySecurityHeaders(redirectResponse)
    }

    return applySecurityHeaders(NextResponse.next())
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/sign-up') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/dashboard-spa') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/boosts') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/community') ||
    pathname.startsWith('/concierge') ||
    pathname.startsWith('/design-system') ||
    pathname.startsWith('/discover') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/gifts') ||
    pathname.startsWith('/help') ||
    pathname.startsWith('/insights') ||
    pathname.startsWith('/likes') ||
    pathname.startsWith('/long-distance') ||
    pathname.startsWith('/match') ||
    pathname.startsWith('/matches') ||
    pathname.startsWith('/premium') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/quests') ||
    pathname.startsWith('/referrals') ||
    pathname.startsWith('/safety') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/spotlight') ||
    pathname.startsWith('/subscription') ||
    pathname.startsWith('/wallet') ||
    pathname.startsWith('/l/') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return applySecurityHeaders(NextResponse.next())
  }

  const pathnameLocale = pathname.split('/')[1]
  if (isSupportedLocale(pathnameLocale)) {
    return applySecurityHeaders(NextResponse.next())
  }

  // Redirect all paths without locale to include the locale
  const locale = pickLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`

  const response = NextResponse.redirect(url)
  response.cookies.set('tm_locale', locale, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return applySecurityHeaders(response)
}

function pickLocale(request: NextRequest): AppLocale {
  const cookieLocale = request.cookies.get('tm_locale')?.value
  if (isSupportedLocale(cookieLocale)) {
    return cookieLocale
  }

  const acceptedLocale = selectFromAcceptLanguage(request.headers.get('accept-language'))
  if (acceptedLocale) {
    return acceptedLocale
  }

  return DEFAULT_LOCALE
}

function selectFromAcceptLanguage(headerValue?: string | null): AppLocale | null {
  if (!headerValue) {
    return null
  }

  const locales = headerValue
    .split(',')
    .map((part) => {
      const [langPart, qPart] = part.trim().split(';q=')
      const priority = qPart ? parseFloat(qPart) : 1
      return { lang: langPart?.toLowerCase(), priority }
    })
    .filter(Boolean)
    .sort((a, b) => b.priority - a.priority)

  for (const localeCandidate of locales) {
    if (!localeCandidate.lang) {
      continue
    }

    const baseLang = localeCandidate.lang.split('-')[0]
    const match = SUPPORTED_LOCALES.find((supported) => supported === localeCandidate.lang || supported === baseLang)
    if (match) {
      return match
    }
  }

  return null
}

export const config = {
  matcher: ['/((?!_next).*)'],
}