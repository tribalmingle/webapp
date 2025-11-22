'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useCallback } from 'react'

import { trackClientEvent } from '@/lib/analytics/client'

type Props = {
  locale: string
  primaryLabel: string
  secondaryLabel: string
  primaryTarget: string
  secondaryTarget: string
}

export function FamilyPortalHeroCtas({ locale, primaryLabel, secondaryLabel, primaryTarget, secondaryTarget }: Props) {
  const handlePrimaryClick = useCallback(() => {
    trackClientEvent('family_portal_cta_click', {
      locale,
      cta: 'primary',
      target: primaryTarget,
    })
  }, [locale, primaryTarget])

  const handleSecondaryClick = useCallback(() => {
    trackClientEvent('family_portal_cta_click', {
      locale,
      cta: 'secondary',
      target: secondaryTarget,
    })
  }, [locale, secondaryTarget])

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href={primaryTarget}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:translate-y-0.5"
        onClick={handlePrimaryClick}
      >
        {primaryLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
      <Link
        href={secondaryTarget}
        className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/5"
        onClick={handleSecondaryClick}
      >
        {secondaryLabel}
      </Link>
    </div>
  )
}
