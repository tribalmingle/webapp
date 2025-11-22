import Link from 'next/link'

import type { TribeMeta } from '@/lib/marketing/tribes'
import { cn } from '@/lib/utils'

type TribeCardProps = {
  tribe: TribeMeta
  active?: boolean
  ctaLabel: string
}

export function TribeCard({ tribe, active, ctaLabel }: TribeCardProps) {
  return (
    <article
      className={cn(
        'rounded-2xl border bg-white/80 p-5 shadow-sm transition',
        active ? 'border-accent shadow-lg' : 'border-purple-100 hover:border-accent/60'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">{tribe.stats.homeBase}</p>
          <h3 className="mt-1 text-2xl font-bold text-foreground">{tribe.name}</h3>
        </div>
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{tribe.stats.population}</span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{tribe.headline}</p>
      <p className="mt-2 text-sm text-muted-foreground/80">{tribe.blurb}</p>
      <dl className="mt-4 text-xs text-muted-foreground">
        <dt className="font-semibold uppercase tracking-[0.25em] text-purple-400">Diaspora cities</dt>
        <dd className="mt-1 text-sm font-medium text-foreground">
          {tribe.stats.diasporaCities.join(' · ')}
        </dd>
      </dl>
      <Link
        href={{ pathname: '/sign-up', query: { tribe: tribe.id } }}
        className="mt-4 inline-flex items-center justify-center rounded-full border border-accent px-5 py-2 text-sm font-semibold text-accent transition hover:bg-accent/10"
      >
        {tribe.heroCta || ctaLabel}
      </Link>
    </article>
  )
}
