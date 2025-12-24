'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { DatingTip, DATING_TIPS } from '@/lib/dating-tips/tips-data'

interface LatestPostsProps {
  currentPostId?: string
}

export function LatestPosts({ currentPostId }: LatestPostsProps) {
  // Sort by publishedAt and filter out current post
  const latestPosts = DATING_TIPS
    .filter((tip) => tip.id !== currentPostId)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 5)

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-neutral-200">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-neutral-900 mb-1">Latest Articles</h3>
        <p className="text-sm text-neutral-500">More dating advice & tips</p>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {latestPosts.map((post) => (
          <Link
            key={post.id}
            href={`/dating-tips/${post.id}`}
            className="group flex gap-3 hover:bg-neutral-50 rounded-lg p-2 -mx-2 transition-colors"
          >
            {/* Thumbnail */}
            <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-neutral-100">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="80px"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-neutral-900 group-hover:text-purple-700 transition-colors line-clamp-2 mb-1">
                {post.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-neutral-500">
                <Clock className="w-3 h-3" />
                <span>{post.readingTime} min read</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View All Link */}
      <div className="mt-6 pt-6 border-t border-neutral-200">
        <Link
          href="/dating-tips"
          className="block text-center text-sm font-semibold text-purple-700 hover:text-purple-900 transition-colors"
        >
          View All Articles →
        </Link>
      </div>
    </div>
  )
}
