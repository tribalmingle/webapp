"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Clock, MapPin, Users } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { PostComposer } from '@/components/community/post-composer'
import { PostCard } from '@/components/community/post-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { useLaunchDarklyFlag } from '@/hooks/use-launchdarkly-flag'
import type { CommunityCommentSummary, CommunityFeedResponse, CommunityPostSummary } from '@/lib/services/community-service'

export default function CommunityClubPage() {
  const params = useParams<{ slug: string }>()
  const slug = useMemo(() => {
    const value = params?.slug
    if (!value) return ''
    return Array.isArray(value) ? value[0] : value
  }, [params])

  const communityFlag = useLaunchDarklyFlag('community-beta', false)
  const { toast } = useToast()
  const [feed, setFeed] = useState<CommunityFeedResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const loadFeed = useCallback(
    async (cursor?: string, append = false) => {
      if (!slug) return
      append ? setLoadingMore(true) : setLoading(true)
      try {
        const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
        const response = await fetch(`/api/community/clubs/${slug}${query}`)
        const json = await response.json().catch(() => null)
        if (!response.ok || !json?.data) {
          throw new Error(json?.error ?? 'Unable to load club feed')
        }
        const nextData: CommunityFeedResponse = json.data
        setFeed((prev) => {
          if (append && prev) {
            return {
              club: nextData?.club ?? prev.club,
              posts: [...prev.posts, ...nextData.posts],
              nextCursor: nextData.nextCursor,
            }
          }
          return nextData
        })
      } catch (error) {
        toast({ title: 'Community unavailable', description: error instanceof Error ? error.message : 'Please try again later', variant: 'destructive' })
      } finally {
        append ? setLoadingMore(false) : setLoading(false)
      }
    },
    [slug, toast],
  )

  useEffect(() => {
    if (!communityFlag || !slug) return
    loadFeed()
  }, [communityFlag, slug, loadFeed])

  const handlePostCreated = useCallback((post: CommunityPostSummary) => {
    setFeed((prev) => (prev ? { ...prev, posts: [post, ...prev.posts] } : prev))
  }, [])

  const handleReactionChange = useCallback((postId: string, reactions: CommunityPostSummary['reactionCounts']) => {
    setFeed((prev) =>
      prev
        ? {
            ...prev,
            posts: prev.posts.map((post) => (post.id === postId ? { ...post, reactionCounts: reactions } : post)),
          }
        : prev,
    )
  }, [])

  const handleCommentCreated = useCallback((postId: string, comment: CommunityCommentSummary) => {
    setFeed((prev) =>
      prev
        ? {
            ...prev,
            posts: prev.posts.map((post) => {
              if (post.id !== postId) return post
              const existing = post.comments ?? []
              return {
                ...post,
                commentCount: post.commentCount + 1,
                comments: [comment, ...existing].slice(0, 3),
              }
            }),
          }
        : prev,
    )
  }, [])

  const handleLoadMore = useCallback(() => {
    if (!feed?.nextCursor) return
    loadFeed(feed.nextCursor, true)
  }, [feed?.nextCursor, loadFeed])

  if (!communityFlag) {
    return (
      <MemberAppShell title="Community" description="Concierge is preparing curated clubs.">
        <Card className="rounded-3xl border-dashed border-primary/40 p-10 text-center text-muted-foreground">
          Community hubs unlock soon. Concierge will notify you once your tribe is invited.
        </Card>
      </MemberAppShell>
    )
  }

  if (loading && !feed) {
    return (
      <MemberAppShell title="Community" description="Loading club…">
        <Card className="rounded-3xl border border-border/60 p-8">Loading club feed…</Card>
      </MemberAppShell>
    )
  }

  if (!feed) {
    return (
      <MemberAppShell title="Community" description="Club unavailable">
        <Card className="rounded-3xl border border-destructive/40 p-10 text-center text-muted-foreground">
          This club is offline or you no longer have access.
        </Card>
      </MemberAppShell>
    )
  }

  return (
    <MemberAppShell
      title={feed.club.name}
      description={feed.club.tagline ?? 'Concierge-managed club'}
      contextualNav={
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Button asChild size="sm" variant="ghost">
            <Link href="/community">← All clubs</Link>
          </Button>
          <Badge variant={feed.club.guardianOnly ? 'destructive' : 'outline'}>
            {feed.club.guardianOnly ? 'Guardian only' : 'Member club'}
          </Badge>
          <span className="text-muted-foreground">{feed.club.memberCount.toLocaleString()} members</span>
        </div>
      }
    >
      <ClubHero club={feed.club} />

      <div className="mt-8 space-y-6">
        <PostComposer clubId={feed.club.id} onPostCreated={handlePostCreated} />
        {feed.posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            interactive
            onReactionChange={handleReactionChange}
            onCommentCreated={handleCommentCreated}
          />
        ))}
        {feed.posts.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-muted-foreground/40 p-8 text-center text-muted-foreground">
            Be the first to post and set the tone for the club.
          </Card>
        ) : null}
        {feed.nextCursor ? (
          <div className="flex justify-center">
            <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more posts'}
            </Button>
          </div>
        ) : null}
      </div>
    </MemberAppShell>
  )
}

function ClubHero({
  club,
}: {
  club: CommunityFeedResponse['club']
}) {
  return (
    <Card className="rounded-3xl border border-border/60 bg-card/80 p-6">
      <div className="flex flex-wrap gap-6">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Concierge club</p>
          <h1 className="mt-2 text-3xl font-semibold">{club.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{club.descriptionLong}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {club.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
        <div className="w-full max-w-xs space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            {club.memberCount.toLocaleString()} members
          </div>
          {club.timezone ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {club.timezone}
            </div>
          ) : null}
          {club.upcomingAma ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Next AMA {formatAmaDate(club.upcomingAma.startAt)}
            </div>
          ) : null}
          {club.featuredHostIds.length ? (
            <p className="text-xs text-muted-foreground">Featuring {club.featuredHostIds.length} hosts</p>
          ) : null}
        </div>
      </div>
    </Card>
  )
}

function formatAmaDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
  }).format(date)
}
