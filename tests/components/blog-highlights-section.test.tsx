import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { BlogHighlightsSection } from '@/components/marketing/blog-highlights-section'
import type { MarketingBlogPost } from '@/lib/contentful'
import { trackClientEvent } from '@/lib/analytics/client'

vi.mock('@/lib/analytics/client', () => ({
  trackClientEvent: vi.fn(),
}))

const posts: MarketingBlogPost[] = [
  {
    id: 'post-1',
    slug: 'rituals',
    title: 'Modern rituals',
    excerpt: 'Keeping ceremonies alive.',
    category: 'Culture',
    readingTime: 5,
    heroImage: '/img.jpg',
    publishedAt: '2025-01-01T00:00:00.000Z',
  },
]

const copy = {
  eyebrow: 'Field Notes',
  title: 'From the Tribe Journal',
  description: 'Editorial picks.',
  ctaLabel: 'Read story',
}

describe('BlogHighlightsSection', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders blog cards with metadata', () => {
    render(<BlogHighlightsSection posts={posts} locale="en" copy={copy} />)

    expect(screen.getByText('Modern rituals')).toBeInTheDocument()
    expect(screen.getByText('Read story')).toBeInTheDocument()
  })

  it('emits analytics when CTA is clicked', () => {
    render(<BlogHighlightsSection posts={posts} locale="en" copy={copy} />)

    fireEvent.click(screen.getByText('Read story'))
    expect(trackClientEvent).toHaveBeenCalledWith('marketing_blog_click', expect.objectContaining({
      postId: 'post-1',
      slug: 'rituals',
    }))
  })
})
