"use client"

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Heart, MessageCircle, Pin, ShieldAlert } from 'lucide-react'

import type { CommunityCommentSummary, CommunityPostSummary } from '@/lib/services/community-service'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export type PostCardProps = {
  post: CommunityPostSummary
  showClubBadge?: boolean
  interactive?: boolean
  onReactionChange?: (postId: string, reactions: CommunityPostSummary['reactionCounts']) => void
  onCommentCreated?: (postId: string, comment: CommunityCommentSummary) => void
}

export function PostCard({ post, showClubBadge, interactive = false, onReactionChange, onCommentCreated }: PostCardProps) {
  const { toast } = useToast()
  const [showComposer, setShowComposer] = useState(false)
  const [comment, setComment] = useState('')
  const [commentPending, setCommentPending] = useState(false)
  const [reacting, setReacting] = useState(false)

  const initials = useMemo(() => {
    const source = post.author.name || post.author.userId
    return source
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [post.author.name, post.author.userId])

  const previewText = post.body ?? (post.richText ? 'Shared a rich media update.' : '')
  const totalReactions = (post.reactionCounts ?? []).reduce((total, reaction) => total + reaction.count, 0)
  const relativeTime = formatRelativeTime(post.createdAt)

  async function handleReact(emoji = 'heart') {
    if (!interactive || reacting) return
    setReacting(true)
    try {
      const response = await fetch(`/api/community/posts/${post.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      const json = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(json?.error ?? 'Reaction failed')
      }
      onReactionChange?.(post.id, json.data)
    } catch (error) {
      toast({ title: 'Unable to react', description: error instanceof Error ? error.message : 'Please try again later', variant: 'destructive' })
    } finally {
      setReacting(false)
    }
  }

  async function handleCommentSubmit() {
    if (!interactive || !comment.trim()) {
      return
    }
    setCommentPending(true)
    try {
      const response = await fetch(`/api/community/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: comment.trim() }),
      })
      const json = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(json?.error ?? 'Comment failed')
      }
      onCommentCreated?.(post.id, json.data)
      setComment('')
      setShowComposer(false)
    } catch (error) {
      toast({ title: 'Unable to comment', description: error instanceof Error ? error.message : 'Please try again later', variant: 'destructive' })
    } finally {
      setCommentPending(false)
    }
  }

  return (
    <Card className="flex flex-col gap-4 rounded-3xl border border-border/70 p-5">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12 border border-border">
          <AvatarImage src={post.author.avatarUrl} alt={post.author.name ?? 'Member'} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-semibold leading-tight">{post.author.name ?? 'Community member'}</p>
            {post.author.tribe && <Badge variant="outline">{post.author.tribe}</Badge>}
            <span className="text-xs text-muted-foreground">{relativeTime}</span>
            {post.pinned ? (
              <Badge variant="secondary" className="gap-1">
                <Pin className="h-3 w-3" /> Pinned
              </Badge>
            ) : null}
            {showClubBadge && post.clubSlug ? (
              <Link href={`/community/clubs/${post.clubSlug}`} className="text-xs text-primary underline-offset-4 hover:underline">
                View club
              </Link>
            ) : null}
          </div>
          {post.tags.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={`${post.id}-${tag}`} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          ) : null}
          {previewText ? <p className="mt-3 text-sm leading-relaxed text-foreground/90">{previewText}</p> : null}
          {post.poll ? (
            <div className="mt-3 rounded-2xl border border-dashed border-primary/40 p-4 text-sm">
              <p className="font-semibold">Live poll</p>
              <p className="text-muted-foreground">Poll responses will appear once the moderator enables them.</p>
            </div>
          ) : null}
          {post.safety?.state && post.safety.state !== 'clear' ? (
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <ShieldAlert className="h-4 w-4" /> Moderation: {post.safety.state}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={interactive ? () => handleReact('heart') : undefined}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition',
              interactive ? 'hover:bg-primary/10 hover:text-primary' : 'cursor-default'
            )}
          >
            <Heart className="h-4 w-4" />
            <span>{totalReactions} likes</span>
          </button>
          <div className="inline-flex items-center gap-1 rounded-full px-3 py-1">
            <MessageCircle className="h-4 w-4" /> {post.commentCount} comments
          </div>
        </div>
        {interactive ? (
          <Button variant="ghost" size="sm" onClick={() => setShowComposer((value) => !value)}>
            {showComposer ? 'Cancel' : 'Add comment'}
          </Button>
        ) : null}
      </div>

      {post.comments?.length ? (
        <div className="space-y-3 rounded-2xl bg-muted/60 p-4">
          {post.comments.slice(0, 3).map((comment) => (
            <div key={comment.id} className="text-sm">
              <p className="font-semibold">{comment.author.name ?? 'Member'}</p>
              <p className="text-muted-foreground">{comment.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {interactive && showComposer ? (
        <div className="space-y-3">
          <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share your perspective" rows={3} />
          <div className="flex justify-end">
            <Button onClick={handleCommentSubmit} disabled={commentPending || !comment.trim()}>
              {commentPending ? 'Posting...' : 'Post comment'}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  )
}

function formatRelativeTime(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000))
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  const diffWeeks = Math.floor(diffDays / 7)
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
}
