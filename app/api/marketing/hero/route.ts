import { NextResponse } from 'next/server'

import { getHeroVariant } from '@/lib/marketing/hero'
import { normalizeLocale } from '@/lib/i18n/locales'

export const revalidate = 120

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = normalizeLocale(searchParams.get('locale'))
  const countryCode = searchParams.get('countryCode')
  const referralCode = searchParams.get('ref')

  const result = await getHeroVariant({ locale, countryCode, referralCode })

  return NextResponse.json({
    success: true,
    hero: result.variant,
    source: result.source,
  })
}