'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MessageCircle, Search, Filter, Sparkles, Shield, HeartHandshake, Pause, Plus } from 'lucide-react'
import Link from 'next/link'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useSessionStore } from '@/lib/state/session-store'
import { trackClientEvent } from '@/lib/analytics/client'

const FOLDERS = [
  { id: 'spark', label: 'Spark', description: 'Fresh intros waiting on you', icon: Sparkles, badgeTone: 'bg-pink-500/20 text-pink-600' },
  { id: 'active', label: 'Active', description: 'Mutual vibe checks in progress', icon: MessageCircle, badgeTone: 'bg-primary/10 text-primary' },
  { id: 'snoozed', label: 'Snoozed', description: 'Paused chats + cooldowns', icon: Pause, badgeTone: 'bg-muted text-muted-foreground' },
  { id: 'trust', label: 'Trust Review', description: 'Needs guardian or ops eyes', icon: Shield, badgeTone: 'bg-amber-100 text-amber-900' },
  { id: 'all', label: 'All', description: 'Unified inbox view', icon: HeartHandshake, badgeTone: 'bg-border text-foreground' },
]

const CONVERSATIONS = [
  {
    name: 'Emma Johnson',
    userId: 'emma@example.com',
    lastMsg: 'That sounds great! When are you free?',
    time: '2m ago',
    unread: 2,
    image: '/diverse-woman-portrait.png',
    folder: 'spark',
    translatorEnabled: true,
    verified: true,
    safetyBadge: 'Verified ID',
  },
  {
    name: 'Jessica Chen',
    userId: 'jessica@example.com',
    lastMsg: 'Thanks for the recommendation!',
    time: '1h ago',
    unread: 0,
    image: '/woman-2.jpg',
    folder: 'active',
    translatorEnabled: false,
    verified: true,
    safetyBadge: 'Guardian ok',
  },
  {
    name: 'Michelle Park',
    userId: 'michelle@example.com',
    lastMsg: 'I would love to try that restaurant',
    time: '3h ago',
    unread: 1,
    image: '/woman-3.jpg',
    folder: 'spark',
    translatorEnabled: true,
    verified: false,
    safetyBadge: 'Safety nudge',
  },
  {
    name: 'Rachel Anderson',
    userId: 'rachel@example.com',
    lastMsg: "Haha, that's so funny!",
    time: 'yesterday',
    unread: 0,
    image: '/woman-4.jpg',
    folder: 'snoozed',
    translatorEnabled: false,
    verified: true,
    safetyBadge: null,
  },
  {
    name: 'Trust Ops',
    userId: 'trust@example.com',
    lastMsg: 'Trust asked for quick confirmation.',
    time: '5m ago',
    unread: 3,
    image: '/placeholder.svg',
    folder: 'trust',
    translatorEnabled: false,
    verified: false,
    safetyBadge: 'Escalated',
  },
]

const PINNED_PROMPTS = [
  { id: 'prompt-art', title: 'Ask about their favorite diaspora artist', body: '“Which artist feels like home to you lately?”' },
  { id: 'prompt-rooted', title: 'Share a family tradition', body: '“My family gathers every equinox—what rituals anchor you?”' },
]

export default function ChatPage() {
  const { inboxPreferences, updateInboxPreferences } = useSessionStore()
  const [pinnedPrompts, setPinnedPrompts] = useState(PINNED_PROMPTS)
  const [arFilters, setArFilters] = useState<Array<{ id: string; name: string; description: string; previewUrl: string }> | null>(null)
  const [filtersError, setFiltersError] = useState<string | null>(null)

  const filteredConversations = useMemo(() => {
    return CONVERSATIONS.filter((conversation) => {
      if (inboxPreferences.folder !== 'all' && conversation.folder !== inboxPreferences.folder) {
        return false
      }
      if (inboxPreferences.filters.query && !conversation.name.toLowerCase().includes(inboxPreferences.filters.query.toLowerCase())) {
        return false
      }
      if (inboxPreferences.filters.unreadOnly && conversation.unread === 0) {
        return false
      }
      if (inboxPreferences.filters.verifiedOnly && !conversation.verified) {
        return false
      }
      if (inboxPreferences.filters.translatorOnly && !conversation.translatorEnabled) {
        return false
      }
      return true
    })
  }, [inboxPreferences.folder, inboxPreferences.filters])

  useEffect(() => {
    let isMounted = true
    async function loadFilters() {
      try {
        const response = await fetch('/api/chat/ar-filters', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to load AR filters')
        }
        if (isMounted) {
          setArFilters(data.filters)
        }
      } catch (error) {
        console.error('Failed to load AR filters', error)
        if (isMounted) {
          setFiltersError('AR filters temporarily unavailable')
        }
      }
    }
    loadFilters()
    return () => {
      isMounted = false
    }
  }, [])

  const handleFolderChange = useCallback(
    (folderId: string) => {
      updateInboxPreferences({ folder: folderId as typeof inboxPreferences.folder })
      trackClientEvent('chat.inbox.folder_change', {
        fromFolder: inboxPreferences.folder,
        toFolder: folderId,
      })
    },
    [inboxPreferences.folder, updateInboxPreferences],
  )

  const handleDismissPrompt = (id: string) => {
    setPinnedPrompts((items) => items.filter((item) => item.id !== id))
    trackClientEvent('chat.inbox.pin_toggled', { threadId: id, action: 'dismissed' })
  }

  const handlePinnedVisibility = () => {
    updateInboxPreferences({ showPinned: !inboxPreferences.showPinned })
    trackClientEvent('chat.inbox.pin_visibility', { showPinned: !inboxPreferences.showPinned })
  }

  const handleQueryChange = (value: string) => {
    updateInboxPreferences({ filters: { ...inboxPreferences.filters, query: value } })
    trackClientEvent('chat.inbox.search', {
      queryLength: value.length,
      unreadOnly: inboxPreferences.filters.unreadOnly,
      filters: {
        verifiedOnly: inboxPreferences.filters.verifiedOnly,
        translatorOnly: inboxPreferences.filters.translatorOnly,
      },
    })
  }

  return (
    <MemberAppShell
      title="Messages"
      description="Concierge curated conversations and sparks."
      actions={
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Start chat
        </Button>
      }
      contextualNav={
        <div className="flex flex-wrap items-center gap-2">
          {FOLDERS.map((tab) => {
            const Icon = tab.icon
            const isActive = inboxPreferences.folder === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFolderChange(tab.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  isActive ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
          <Button variant="ghost" size="sm" className="gap-2 text-xs">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {inboxPreferences.showPinned && (
          <div className="rounded-3xl border border-border bg-card/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pinned concierge prompts</p>
                <p className="text-sm text-foreground">Drop these into your next spark to keep momentum.</p>
              </div>
              <Button variant="ghost" size="sm" className="text-xs" onClick={handlePinnedVisibility}>
                Hide
              </Button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {pinnedPrompts.map((prompt) => (
                <article key={prompt.id} className="rounded-2xl border border-border/70 bg-background/70 p-3">
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{prompt.title}</p>
                      <p className="text-xs text-muted-foreground">{prompt.body}</p>
                    </div>
                    <button
                      type="button"
                      className="text-[11px] text-muted-foreground transition hover:text-foreground"
                      onClick={() => handleDismissPrompt(prompt.id)}
                    >
                      Dismiss
                    </button>
                  </header>
                </article>
              ))}
            </div>
          </div>
        )}

        {!inboxPreferences.showPinned && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={handlePinnedVisibility}>
            Show concierge prompts
          </Button>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={inboxPreferences.filters.query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Search conversations, intents, or guardians"
            className="w-full rounded-2xl border border-border bg-background/80 py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="rounded-3xl border border-border bg-card/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Concierge tip</p>
          <p className="text-sm text-foreground">Members who reply within 5 minutes get 3x more sparks. Turn on boost mode before live events.</p>
        </div>

        <div className="rounded-3xl border border-dashed border-primary/30 bg-linear-to-br from-primary/5 via-background to-background/90 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">AR chat filters</p>
              <p className="text-sm text-muted-foreground">Instantly shift the vibe with concierge-approved overlays.</p>
            </div>
            <Badge variant="outline" className="text-[10px] uppercase">Beta</Badge>
          </div>
          {filtersError && <p className="mt-3 text-xs text-red-500">{filtersError}</p>}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(arFilters ?? []).map((filter) => (
              <div key={filter.id} className="rounded-2xl border border-border/80 bg-background/70 p-3">
                <p className="text-sm font-semibold">{filter.name}</p>
                <p className="text-xs text-muted-foreground">{filter.description}</p>
                <Link href={`/chat/filters/${filter.id}`} className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline">
                  Preview effect →
                </Link>
              </div>
            ))}
            {!arFilters && !filtersError && (
              <div className="text-sm text-muted-foreground">Loading filters…</div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filteredConversations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 p-8 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-semibold">No conversations here yet</p>
              <p className="text-sm text-muted-foreground">Start liking profiles or send a concierge-introduced spark to begin chatting.</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <Link
                key={conversation.userId}
                href={`/chat/${conversation.userId}`}
                className="flex items-center gap-4 rounded-3xl border border-border bg-card/70 p-4 transition hover:border-primary/60"
              >
                <img src={conversation.image || '/placeholder.svg'} alt={conversation.name} className="h-14 w-14 rounded-2xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight">{conversation.name}</p>
                      <p className="text-xs text-muted-foreground">{conversation.time}</p>
                    </div>
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {conversation.folder}
                    </Badge>
                  </div>
                  <p className="mt-2 truncate text-sm text-muted-foreground">{conversation.lastMsg}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {conversation.translatorEnabled && (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                        Translator ready
                      </Badge>
                    )}
                    {conversation.safetyBadge && (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                        {conversation.safetyBadge}
                      </Badge>
                    )}
                  </div>
                </div>
                {conversation.unread > 0 && (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    {conversation.unread}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </MemberAppShell>
  )
}
