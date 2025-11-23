"use client"

import { FormEvent, useState } from 'react'

import type { CommunityPostSummary } from '@/lib/services/community-service'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export function PostComposer({ clubId, onPostCreated }: { clubId: string; onPostCreated?: (post: CommunityPostSummary) => void }) {
  const { toast } = useToast()
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!body.trim()) {
      toast({ title: 'Post needs content', description: 'Share an update, question, or prompt before posting.', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId, body: body.trim(), tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) }),
      })
      const json = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(json?.error ?? 'Unable to publish')
      }
      onPostCreated?.(json.data)
      setBody('')
      setTags('')
      toast({ title: 'Posted to club', description: 'Members will see it at the top of the feed.' })
    } catch (error) {
      toast({ title: 'Post failed', description: error instanceof Error ? error.message : 'Try again in a moment', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="rounded-3xl border border-dashed border-primary/40 bg-primary/5 p-5">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Share with the club</p>
          <p className="text-xs text-muted-foreground">Questions, wins, AMA prompts, or concierge updates are welcome.</p>
        </div>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What would you like to talk about?"
          rows={4}
          maxLength={1200}
        />
        <Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Optional tags (comma separated)" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{body.length}/1200 characters</span>
          <Button type="submit" disabled={submitting || !body.trim()}>
            {submitting ? 'Posting…' : 'Post to club'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
