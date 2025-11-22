import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { SUPPORTED_LOCALES, isRtlLocale, normalizeLocale } from '@/lib/i18n/locales'

type LocaleLayoutProps = {
  children: ReactNode
  params: Promise<{
    locale: string
  }>
}

export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }))
}

const metadataBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  return {
    alternates: {
      languages: SUPPORTED_LOCALES.reduce<Record<string, string>>((accumulator, current) => {
        accumulator[current] = `/${current}`
        return accumulator
      }, {}),
    },
    metadataBase: new URL(metadataBaseUrl),
    other: {
      locale,
    },
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr'

  return (
    <div data-locale={locale} dir={dir} className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  )
}