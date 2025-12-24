'use client'

import { DatingTip } from '@/lib/dating-tips/tips-data'
import { SignUpCTA } from './sidebar-widgets/SignUpCTA'
import { TestimonialsCarousel } from './sidebar-widgets/TestimonialsCarousel'
import { FeaturedEvents } from './sidebar-widgets/FeaturedEvents'
import { LatestPosts } from './sidebar-widgets/LatestPosts'

interface PostSidebarProps {
  currentPostId?: string
  allPosts?: DatingTip[]
}

export function PostSidebar({ currentPostId, allPosts }: PostSidebarProps) {
  return (
    <aside className="space-y-8">
      {/* Sign-Up CTA Widget (Step 4) */}
      <SignUpCTA />

      {/* Testimonials Carousel Widget (Step 5) */}
      <TestimonialsCarousel />

      {/* Featured Events Widget (Step 6) */}
      <FeaturedEvents />

      {/* Latest Posts Widget (Step 7) */}
      <LatestPosts currentPostId={currentPostId} />
    </aside>
  )
}
