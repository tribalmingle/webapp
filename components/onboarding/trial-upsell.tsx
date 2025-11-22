export type TrialUpsellContext = 'security' | 'media' | 'plan'

type TrialUpsellCardProps = {
  context: TrialUpsellContext
  acknowledged?: boolean
  onAction?: (context: TrialUpsellContext) => void
}

type TrialCopy = {
  headline: string
  body: string
  highlights: string[]
  flairs: string
}

const COPY: Record<TrialUpsellContext, TrialCopy> = {
  security: {
    headline: 'Preview Elite concierge security',
    body: 'Unlock a 14-day white-glove trial that includes priority steward check-ins once your identity checks clear.',
    highlights: ['Passkey backup coaching', 'Fast-track manual review', 'Private steward hotline'],
    flairs: '🛡️'
  },
  media: {
    headline: 'Boost trust with premium badges',
    body: 'Members on Elite trials get accelerated AI scoring plus a featured badge next to their profile media.',
    highlights: ['Priority AI scoring queue', 'Featured verification flair', 'Manual retouch feedback'],
    flairs: '✨'
  },
  plan: {
    headline: 'Elite plan preview',
    body: 'Sample the Elite tier for 14 days — concierge intros, unlimited filters, and live steward office hours.',
    highlights: ['Concierge-led intros', 'Advanced preference filters', 'Weekly steward office hours'],
    flairs: '🌿'
  }
}

export function TrialUpsellCard({ context, acknowledged = false, onAction }: TrialUpsellCardProps) {
  const copy = COPY[context]

  return (
    <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 shadow-inner">
      <div className="flex items-start gap-3">
        <div className="text-2xl" aria-hidden>{copy.flairs}</div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold text-accent uppercase tracking-wide">Trial preview</p>
            <p className="text-lg font-bold text-foreground">{copy.headline}</p>
            <p className="text-sm text-muted-foreground mt-1">{copy.body}</p>
          </div>

          <ul className="text-sm text-foreground/80 space-y-1">
            {copy.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2">
                <span className="text-accent">•</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => onAction?.(context)}
            disabled={acknowledged}
            className={`w-full rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              acknowledged
                ? 'border-border text-muted-foreground bg-white/60 cursor-default'
                : 'border-accent bg-accent text-accent-foreground hover:opacity-90'
            }`}
          >
            {acknowledged ? 'We will cue your trial reminders' : 'Save my Elite trial spot'}
          </button>

          {acknowledged && (
            <p className="text-xs text-muted-foreground text-center">
              We will surface Elite plan details again once you reach the plan step.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
