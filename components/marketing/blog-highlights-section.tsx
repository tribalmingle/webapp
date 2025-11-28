"use client"

import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'

import type { MarketingBlogPost } from '@/lib/contentful'
import { trackClientEvent } from '@/lib/analytics/client'
import { Badge } from '@/components/ui/badge'

export type BlogHighlightsCopy = {
  eyebrow: string
  title: string
  description: string
  ctaLabel: string
}

type BlogHighlightsSectionProps = {
  posts: MarketingBlogPost[]
  locale: string
  copy: BlogHighlightsCopy
}

export function BlogHighlightsSection({ posts, locale, copy }: BlogHighlightsSectionProps) {
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
  }), [locale])

  const handleClick = (post: MarketingBlogPost, position: number) => {
    trackClientEvent('marketing_blog_click', {
      postId: post.id,
      slug: post.slug,
      locale,
      position,
    })
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <Badge variant="gold" className="mb-6 bg-gold-warm text-white border-transparent shadow-md">
          <Sparkles className="w-3 h-3 mr-1" />
          {copy.eyebrow}
        </Badge>
        <h2 className="text-h1 font-display text-neutral-900 mb-4">
          {copy.title}
        </h2>
        <p className="text-body-lg text-neutral-600 max-w-3xl mx-auto">
          {copy.description}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <article
            key={post.id}
            className="flex h-full flex-col rounded-3xl border border-neutral-200 bg-neutral-50 p-6 shadow-lg card-lift hover:shadow-xl transition-all"
          >
            {post.heroImage ? (
              <div className="relative mb-6 h-48 w-full overflow-hidden rounded-2xl border border-neutral-100">
                <img
                  src={post.heroImage}
                  alt={post.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
            
            <div className="rounded-2xl bg-white p-4 border border-neutral-100 shadow-sm">
              <p className="text-label text-purple-royal font-bold mb-3 uppercase tracking-wider text-xs">
                {post.category || 'Editorial'}
              </p>
              <h3 className="text-h3 text-neutral-900 mb-3 font-display">
                {post.title}
              </h3>
              <p className="text-body-sm text-neutral-600 line-clamp-3">
                {post.excerpt}
              </p>
            </div>
            
            <div className="mt-6 flex items-center justify-between text-caption text-neutral-500 font-medium">
              <span>{dateFormatter.format(new Date(post.publishedAt))}</span>
              {post.readingTime ? <span>{post.readingTime} min read</span> : null}
            </div>
            
            <Link
              href={`/blog/${post.slug}`}
              className="mt-6 inline-flex items-center gap-2 text-body-sm font-bold text-purple-royal hover:text-purple-royal-light transition-colors"
              onClick={() => handleClick(post, index)}
            >
              {copy.ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

