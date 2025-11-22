import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TribeMap, type MapSectionCopy } from '@/components/marketing/tribe-map'
import type { TribeMeta } from '@/lib/marketing/tribes'

const copy: MapSectionCopy = {
  title: 'Test title',
  description: 'Test description',
  cta: 'CTA',
  fallbackTitle: 'Fallback list',
  fallbackDescription: 'Fallback description',
}

const tribes: TribeMeta[] = [
  {
    id: 'sample',
    name: 'Sample Tribe',
    headline: 'Headline',
    blurb: 'Blurb',
    stats: {
      homeBase: 'Somewhere',
      diasporaCities: ['City A', 'City B'],
      population: '1M+',
    },
    heroCta: 'Apply now',
  },
]

const regions = {
  type: 'FeatureCollection',
  features: [],
} as const

describe('TribeMap', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    vi.spyOn(window.HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('renders fallback list when WebGL is unavailable', () => {
    render(<TribeMap regions={regions as any} tribes={tribes} locale="en" copy={copy} />)
    expect(screen.getByText(copy.fallbackTitle)).toBeInTheDocument()
    expect(screen.getAllByText('Sample Tribe').length).toBeGreaterThan(0)
  })
})
