import Link from 'next/link'

import type { HeroVariant } from '@/lib/marketing/hero'
import { cn } from '@/lib/utils'

export type HeroSectionProps = {
  variant: HeroVariant
  subcopy: string
  className?: string
  primaryHref?: string
  secondaryHref?: string
}

export function HeroSection({
  variant,
  subcopy,
  className,
  primaryHref = '/sign-up',
  secondaryHref = '/login',
}: HeroSectionProps) {
  const alignmentClass = variant.alignment === 'left' ? 'items-start text-left' : 'items-center text-center lg:items-start lg:text-left'

  return (
    <div className={cn('flex flex-col', alignmentClass, className)} dir={variant.direction === 'rtl' ? 'rtl' : 'ltr'} data-variant={variant.key}>
      <div className="mb-4 flex flex-col items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-purple-500 lg:items-start">
        {variant.badge ? (
          <span className="rounded-full border border-purple-200 px-3 py-1 text-xs text-purple-600">{variant.badge}</span>
        ) : null}
        <span>{variant.tagline}</span>
      </div>
      <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {variant.title}{' '}
        <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">{variant.highlight}</span>
      </h1>
      <p className="mt-6 text-lg text-muted-foreground">{variant.description}</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={primaryHref}
          className="flex-1 rounded-xl bg-purple-gradient px-6 py-4 text-center text-lg font-semibold text-white shadow-sm transition hover:scale-[1.01]"
        >
          {variant.primaryCta}
        </Link>
        <Link
          href={secondaryHref}
          className="flex-1 rounded-xl border border-purple-royal px-6 py-4 text-center text-lg font-semibold text-purple-royal transition hover:bg-purple-royal/10"
        >
          {variant.secondaryCta}
        </Link>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{subcopy}</p>
    </div>
  )
}

