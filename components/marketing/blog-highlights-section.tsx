"use client"

import Link from 'next/link'
import { useMemo } from 'react'

import type { MarketingBlogPost } from '@/lib/contentful'
import { trackClientEvent } from '@/lib/analytics/client'

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
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-400">{copy.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{copy.title}</h2>
        <p className="mt-3 text-sm text-muted-foreground">{copy.description}</p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <article
            key={post.id}
            className="flex h-full flex-col rounded-3xl border border-purple-100 bg-white/80 p-6 shadow-sm"
          >
            {post.heroImage ? (
              <div className="relative mb-6 h-40 w-full overflow-hidden rounded-2xl border border-purple-50">
                <img
                  src={post.heroImage}
                  alt={post.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}
            <div className="rounded-2xl bg-linear-to-br from-purple-50 to-blue-50 p-4 text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-purple-500">{post.category || 'Editorial'}</p>
              <h3 className="mt-3 text-xl font-semibold text-foreground">{post.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{post.excerpt}</p>
            </div>
            <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
              <span>{dateFormatter.format(new Date(post.publishedAt))}</span>
              {post.readingTime ? <span>{post.readingTime} min read</span> : null}
            </div>
            <Link
              href={`/blog/${post.slug}`}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:opacity-80"
              onClick={() => handleClick(post, index)}
            >
              {copy.ctaLabel}
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}

