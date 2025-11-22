import type { ReactNode } from "react"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { isSupportedLocale } from "@/lib/i18n/config"

export default function LocaleLayout({ children, params }: { children: ReactNode; params: { locale: string } }) {
  const locale = isSupportedLocale(params.locale) ? params.locale : "en"

  return (
    <div className="min-h-screen bg-brand-sand/40 px-4">
      <div className="mx-auto max-w-6xl py-6">
        <SiteHeader locale={locale} />
        {children}
        <SiteFooter />
      </div>
    </div>
  )
}
