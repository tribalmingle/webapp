import type { AppLocale } from '@/lib/i18n/locales'
import { getTribeMapData } from '@/lib/marketing/tribes'
import { TribeMap, type MapSectionCopy } from '@/components/marketing/tribe-map'

const FALLBACK_COPY: MapSectionCopy = {
  title: 'Explore tribes and diaspora love stories',
  description: 'See where our members are building intentional relationships across Africa and the diaspora.',
  cta: 'Apply to join this tribe',
  fallbackTitle: 'Browse highlighted tribes',
  fallbackDescription: 'Your browser does not support the immersive map. Discover featured tribes below.',
}

type TribeMapSectionProps = {
  locale: AppLocale
  copy?: Partial<MapSectionCopy>
}

export async function TribeMapSection({ locale, copy }: TribeMapSectionProps) {
  const data = await getTribeMapData(locale)
  const resolvedCopy: MapSectionCopy = { ...FALLBACK_COPY, ...copy }

  return (
    <section id="tribes" className="bg-gradient-to-b from-white via-blue-50/50 to-purple-50/60 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">{resolvedCopy.title}</p>
          <h2 className="mt-3 text-4xl font-bold text-foreground">{resolvedCopy.description}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hover, tap, or browse each tribe to learn where we already have trusted members on the ground.
          </p>
        </div>
        <div className="mt-12">
          <TribeMap regions={data.regions} tribes={data.tribes} locale={locale} copy={resolvedCopy} />
        </div>
      </div>
    </section>
  )
}
