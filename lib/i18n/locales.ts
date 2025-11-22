export const SUPPORTED_LOCALES = ['en', 'fr', 'pt', 'ar'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'en'

export const RTL_LOCALES: AppLocale[] = ['ar']

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: 'English',
  fr: 'Français',
  pt: 'Português',
  ar: 'العربية',
}

export const marketingLocaleMeta: Record<AppLocale, { region: string; currency: string }> = {
  en: { region: 'global', currency: 'USD' },
  fr: { region: 'francophone', currency: 'EUR' },
  pt: { region: 'lusophone', currency: 'BRL' },
  ar: { region: 'mena', currency: 'AED' },
}

export function isSupportedLocale(locale?: string | null): locale is AppLocale {
  return Boolean(locale && SUPPORTED_LOCALES.includes(locale as AppLocale))
}

export function isRtlLocale(locale: AppLocale): boolean {
  return RTL_LOCALES.includes(locale)
}

export function normalizeLocale(locale?: string | null): AppLocale {
  if (isSupportedLocale(locale)) {
    return locale
  }
  return DEFAULT_LOCALE
}