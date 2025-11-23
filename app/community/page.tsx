"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarDays, Search, Sparkles, Users } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { ClubCard } from '@/components/community/club-card'
import { PostCard } from '@/components/community/post-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { useLaunchDarklyFlag } from '@/hooks/use-launchdarkly-flag'
import type { CommunityLandingResponse } from '@/lib/services/community-service'
import { cn } from '@/lib/utils'

const FILTERS = [
  { id: 'all', label: 'All clubs' },
  { id: 'open', label: 'Member clubs' },
  { id: 'guardian', label: 'Guardian circles' },
] as const

export default function CommunityPage() {
  const { toast } = useToast()
  const communityFlag = useLaunchDarklyFlag('community-beta', false)
  const [data, setData] = useState<CommunityLandingResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!communityFlag) return
    const controller = new AbortController()
    setLoading(true)
    fetch('/api/community/clubs', { signal: controller.signal })
      .then((response) => response.json().then((json) => ({ ok: response.ok, json })))
      .then(({ ok, json }) => {
        if (!ok || !json?.data) {
          throw new Error(json?.error ?? 'Unable to load clubs')
        }
        setData(json.data)
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        toast({ title: 'Community unavailable', description: error instanceof Error ? error.message : 'Try again shortly', variant: 'destructive' })
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [communityFlag, toast])

  const filteredClubs = useMemo(() => {
    if (!data) return []
    const query = search.trim().toLowerCase()
    return data.clubs.filter((club) => {
      if (filter === 'guardian' && !club.guardianOnly) return false
      if (filter === 'open' && club.guardianOnly) return false
      if (!query) return true
      return (
        club.name.toLowerCase().includes(query) ||
        club.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        club.tagline?.toLowerCase().includes(query)
      )
    })
  }, [data, filter, search])

  const heroStats = useMemo(() => {
    if (!data) return { clubCount: 0, guardianCount: 0, amaCount: 0 }
    return {
      clubCount: data.clubs.length,
      guardianCount: data.clubs.filter((club) => club.guardianOnly).length,
      amaCount: data.amaSchedule.length,
    }
  }, [data])

  if (!communityFlag) {
    return (
      <MemberAppShell title="Community" description="Concierge is preparing curated clubs.">
        <Card className="rounded-3xl border-dashed border-primary/40 p-10 text-center text-muted-foreground">
          Community hubs unlock soon. Concierge will notify you once your tribe is invited.
        </Card>
      </MemberAppShell>
    )
  }

  return (
    <MemberAppShell
      title="Community"
      description="Clubs curated by concierge, guardian circles, and AMA drops."
      contextualNav={
        <div className="flex flex-wrap items-center gap-3">
          {FILTERS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-semibold transition',
                filter === entry.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
              )}
              onClick={() => setFilter(entry.id)}
            >
              {entry.label}
            </button>
          ))}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search clubs" className="h-9 w-56 rounded-full pl-9 text-sm" />
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/events">Upcoming salons</Link>
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Active clubs" value={heroStats.clubCount} icon={Users} loading={loading} />
        <MetricCard label="Guardian circles" value={heroStats.guardianCount} icon={Sparkles} loading={loading} />
        <MetricCard label="Upcoming AMAs" value={heroStats.amaCount} icon={CalendarDays} loading={loading} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Clubs</h2>
              <p className="text-sm text-muted-foreground">Concierge-curated spaces by tribe, craft, and guardian focus.</p>
            </div>
            <Badge variant="outline">{filteredClubs.length} live</Badge>
          </div>
          <div className="grid gap-5">
            {filteredClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
          {!loading && filteredClubs.length === 0 ? (
            <Card className="mt-4 rounded-3xl border-dashed border-muted-foreground/40 p-8 text-center text-muted-foreground">
              No clubs match those filters yet. Try another tribe or remove search.
            </Card>
          ) : null}
        </section>

        <aside className="space-y-8">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Trending posts</h3>
              <Badge variant="secondary">Live</Badge>
            </div>
            <div className="space-y-4">
              {data?.trendingPosts?.length ? (
                data.trendingPosts.map((post) => <PostCard key={post.id} post={post} showClubBadge interactive={false} />)
              ) : (
                <Card className="rounded-3xl border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
                  Posts from guardian circles will appear here once clubs go live.
                </Card>
              )}
            </div>
          </div>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">AMA schedule</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/events">View all</Link>
              </Button>
            </div>
            <div className="space-y-3">
              {data?.amaSchedule?.length ? (
                data.amaSchedule.map((session) => (
                  <Card key={`${session.clubId}-${session.startAt}`} className="rounded-2xl border border-border/70 p-4">
                    <p className="text-sm font-semibold">{session.topic}</p>
                    <p className="text-xs text-muted-foreground">{formatAmaDate(session.startAt)}</p>
                    <p className="mt-2 text-sm">
                      <span className="font-semibold">{session.clubName}</span>
                      {session.hostName ? ` · Host ${session.hostName}` : ''}
                    </p>
                    <Button variant="link" size="sm" className="px-0" asChild>
                      <Link href={`/community/clubs/${session.clubSlug}`}>Enter club</Link>
                    </Button>
                  </Card>
                ))
              ) : (
                <Card className="rounded-3xl border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
                  AMA drops will be published once the concierge finalizes hosts.
                </Card>
              )}
            </div>
          </div>
        </aside>
      </div>
    </MemberAppShell>
  )
}

function MetricCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string
  value: number
  icon: typeof Users
  loading: boolean
}) {
  return (
    <Card className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-none">
      <div className="flex items-center gap-2 text-primary">
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold">{loading ? '—' : value}</p>
    </Card>
  )
}

function formatAmaDate(value: string) {
  const date = new Date(value)
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}
