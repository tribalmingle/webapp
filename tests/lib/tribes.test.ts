import { describe, expect, it } from 'vitest'

import { getTribeMapData } from '@/lib/marketing/tribes'

describe('getTribeMapData', () => {
  it('returns geojson features and tribe metadata', async () => {
    const data = await getTribeMapData('en')
    expect(Array.isArray(data.tribes)).toBe(true)
    expect(data.tribes.length).toBeGreaterThanOrEqual(20)
    expect(data.regions.type).toBe('FeatureCollection')
    expect(Array.isArray((data.regions as any).features)).toBe(true)
    expect((data.regions as any).features.length).toBeGreaterThanOrEqual(20)
  })
})
