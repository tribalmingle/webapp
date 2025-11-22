import { describe, expect, it } from 'vitest'

import { fetchMarketingBlogPosts, fetchMarketingEvents } from '@/lib/contentful'

describe('CMS fallbacks', () => {
  it('returns fallback blog posts when Contentful is disabled', async () => {
    const posts = await fetchMarketingBlogPosts('en', 2)
    expect(posts.length).toBeGreaterThan(0)
    expect(posts[0].title.length).toBeGreaterThan(0)
  })

  it('returns fallback events when Contentful is disabled', async () => {
    const events = await fetchMarketingEvents('fr', 2)
    expect(events.length).toBeGreaterThan(0)
    expect(events[0].city.length).toBeGreaterThan(0)
  })
})
