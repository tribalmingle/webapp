"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Filter, Flame, Heart, MapPin, MessageCircle, Save, Sparkles, SwitchCamera, Users } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useLaunchDarklyFlag } from '@/hooks/use-launchdarkly-flag'
import { cn } from '@/lib/utils'

type DiscoveryFilters = {
  verifiedOnly?: boolean
  guardianApproved?: boolean
  travelMode?: 'home' | 'passport'
  onlineNow?: boolean
  faithPractice?: string
  lifeGoals?: string[]
}

type Candidate = {
  candidateId: string
  matchScore: number
  conciergePrompt: string
  aiOpener: string
  scoreBreakdown: Record<string, number>
  boostContext?: { placement: string; endsAt?: string }
  profile: {
    name: string
    tribe?: string
    age?: number
    trustBadges?: string[]
    location?: { city?: string; country?: string }
    verificationStatus?: { badgeIssuedAt?: string }
    faithPractice?: string
    marriageTimeline?: string
    childrenPreference?: string
  }
}

type DiscoverFeed = {
  mode: 'swipe' | 'story'
  filters: DiscoveryFilters
  candidates: Candidate[]
  storyPanels: Array<Candidate & { contextPanel: string }>
  recipes: Array<{ id: string; name: string; isDefault: boolean }>
  telemetry: { generatedAt: string; total: number }
}

const QUICK_TOGGLES: Array<{ id: keyof DiscoveryFilters; label: string }> = [
  { id: 'verifiedOnly', label: 'Verified only' },
  { id: 'guardianApproved', label: 'Guardian approved' },
  { id: 'travelMode', label: 'Travel mode' },
  { id: 'onlineNow', label: 'Online now' },
]

export default function DiscoverPage() {
  const [mode, setMode] = useState<'swipe' | 'story'>('swipe')
  const [filters, setFilters] = useState<DiscoveryFilters>({ verifiedOnly: true, travelMode: 'home' })
  const [feed, setFeed] = useState<DiscoverFeed | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null)
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [boostStrip, setBoostStrip] = useState<{ active: any[]; upcoming: any[] } | null>(null)
  const [pendingInteraction, setPendingInteraction] = useState<string | null>(null)
  const advancedFiltersEnabled = useLaunchDarklyFlag('member-discovery-advanced-filters', true)

  const filterKey = useMemo(() => JSON.stringify(filters), [filters])

  const trackEvent = useCallback((event: string, properties?: Record<string, unknown>) => {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties }),
    }).catch(() => null)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function loadFeed() {
      setLoading(true)
      const params = new URLSearchParams({ mode })
      if (selectedRecipe) params.set('recipeId', selectedRecipe)
      const parsedFilters: Record<string, string> = {}
      Object.entries(filters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === false) return
        if (Array.isArray(value)) {
          if (value.length) parsedFilters[key] = value.join(',')
          return
        }
        parsedFilters[key] = String(value)
      })
      Object.entries(parsedFilters).forEach(([key, value]) => params.set(key, value))
      const response = await fetch(`/api/discover?${params.toString()}`, { signal: controller.signal })
      const json = await response.json()
      if (response.ok) {
        setFeed(json.data)
        setFilters((prev) => ({ ...prev, ...json.data.filters }))
      }
      setLoading(false)
    }
    loadFeed()
      .then(() => trackEvent('discover.feed.loaded', { mode, recipeId: selectedRecipe }))
      .catch(() => setLoading(false))
    return () => controller.abort()
  }, [mode, filterKey, selectedRecipe, trackEvent])

  useEffect(() => {
    fetch('/api/boosts/strip')
      .then((res) => res.json())
      .then((json) => {
        if (json?.data) setBoostStrip(json.data)
      })
      .catch(() => null)
  }, [])

  const handleToggle = useCallback(
    (key: keyof DiscoveryFilters) => {
      if (key === 'travelMode') {
        setFilters((prev) => ({ ...prev, travelMode: prev.travelMode === 'passport' ? 'home' : 'passport' }))
        trackEvent('discover.filter.applied', { key, value: filters.travelMode === 'passport' ? 'home' : 'passport' })
        return
      }
      setFilters((prev) => ({ ...prev, [key]: !prev[key] }))
      trackEvent('discover.filter.applied', { key, value: !filters[key] })
    },
    [filters, trackEvent],
  )

  const handleSaveRecipe = useCallback(async () => {
    const name = window.prompt('Name this filter recipe')
    if (!name) return
    const response = await fetch('/api/discover/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, filters }),
    })
    const json = await response.json()
    if (response.ok) {
      setSelectedRecipe(json.data?._id ?? json.data?.id ?? null)
      trackEvent('discover.filter.saved', { recipeName: name })
    }
  }, [filters, trackEvent])

  const handleInteraction = useCallback(
    async (endpoint: 'like' | 'super-like', targetId: string) => {
      setPendingInteraction(targetId)
      try {
        await fetch(`/api/interactions/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetId, context: { source: 'swipe' } }),
        })
        trackEvent(`discover.${endpoint}`, { targetId })
      } finally {
        setPendingInteraction(null)
      }
    },
    [trackEvent],
  )

  const candidates = feed?.candidates ?? []

  return (
    <MemberAppShell
      title="Discover"
      description="Dual-mode discovery blends swipe chemistry with cultural story cards."
      contextualNav={
        <div className="flex flex-wrap items-center gap-2">
          {QUICK_TOGGLES.map((toggle) => (
            <TogglePill
              key={toggle.id}
              label={toggle.label}
              active={Boolean(filters[toggle.id]) || (toggle.id === 'travelMode' && filters.travelMode === 'passport')}
              onClick={() => handleToggle(toggle.id)}
            />
          ))}
          {advancedFiltersEnabled && (
            <Sheet open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto gap-2">
                  <Filter className="h-4 w-4" /> Advanced filters
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Advanced filters</SheetTitle>
                </SheetHeader>
                <AdvancedFilters filters={filters} onChange={setFilters} onClose={() => setAdvancedFiltersOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        <HeroStats loading={loading} total={feed?.telemetry.total ?? 0} generatedAt={feed?.telemetry.generatedAt} boostStrip={boostStrip} />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={mode === 'swipe' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setMode('swipe')}
          >
            <Sparkles className="h-4 w-4" /> Swipe stack
          </Button>
          <Button
            variant={mode === 'story' ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setMode('story')}
          >
            <SwitchCamera className="h-4 w-4" /> Story grid
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Select value={selectedRecipe ?? ''} onValueChange={(value) => setSelectedRecipe(value || null)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select recipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Current filters</SelectItem>
                {feed?.recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={handleSaveRecipe} className="gap-2">
              <Save className="h-4 w-4" /> Save recipe
            </Button>
          </div>
        </div>

        {mode === 'swipe' ? (
          <SwipeStack
            candidates={candidates}
            onLike={(candidateId) => handleInteraction('like', candidateId)}
            onSuperLike={(candidateId) => handleInteraction('super-like', candidateId)}
            pendingTargetId={pendingInteraction}
          />
        ) : (
          <StoryModeGrid panels={feed?.storyPanels ?? []} />
        )}
      </div>
    </MemberAppShell>
  )
}

function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-semibold transition',
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  )
}

function HeroStats({
  loading,
  total,
  generatedAt,
  boostStrip,
}: {
  loading: boolean
  total: number
  generatedAt?: string
  boostStrip: { active: any[]; upcoming: any[] } | null
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-none">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Morning refresh</span>
          <span>{generatedAt ? new Date(generatedAt).toLocaleTimeString() : 'Pending'}</span>
        </div>
        <p className="mt-3 text-3xl font-semibold">{loading ? '—' : total}</p>
        <p className="text-xs text-muted-foreground">Concierge-picked sparks ready now</p>
      </Card>
      <Card className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-none">
        <div className="flex items-center gap-2 text-primary">
          <MapPin className="h-5 w-5" />
          Travel / boost strip
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {boostStrip?.active.length ? (
            boostStrip.active.map((session) => (
              <p key={session.sessionId} className="text-foreground">
                {session.placement} ends {new Date(session.endsAt).toLocaleTimeString()}
              </p>
            ))
          ) : (
            <p className="text-muted-foreground">No active boosts. Spotlight available.</p>
          )}
        </div>
      </Card>
      <Card className="rounded-3xl border border-border/70 bg-card/80 p-4 shadow-none">
        <div className="flex items-center gap-2 text-primary">
          <Users className="h-5 w-5" />
          Concierge cues
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Track what happens after boosting + filters; steward team sees same context for concierges.
        </p>
      </Card>
    </section>
  )
}

function SwipeStack({
  candidates,
  onLike,
  onSuperLike,
  pendingTargetId,
}: {
  candidates: Candidate[]
  onLike: (candidateId: string) => Promise<void> | void
  onSuperLike: (candidateId: string) => Promise<void> | void
  pendingTargetId: string | null
}) {
  if (!candidates.length) {
    return <Card className="rounded-3xl border border-dashed border-border/70 p-10 text-center text-muted-foreground">No matches fit the filters. Try relaxing a toggle.</Card>
  }

  const stackers = candidates.slice(0, 4)
  return (
    <div className="relative h-[480px]">
      {stackers.map((candidate, index) => (
        <article
          key={candidate.candidateId}
          className="absolute inset-0 rounded-[32px] border border-border/60 bg-card p-6 shadow-2xl transition-all"
          style={{ transform: `translateY(${index * 16}px) scale(${1 - index * 0.03})`, zIndex: 10 - index }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold">{candidate.profile.name}</h3>
              <p className="text-sm text-muted-foreground">
                {candidate.profile.tribe} • {candidate.profile.location?.city ?? 'Global'}
              </p>
            </div>
            <Badge variant="secondary">{Math.round(candidate.matchScore * 100)}% match</Badge>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{candidate.conciergePrompt}</p>
          <p className="mt-2 text-xs italic text-muted-foreground">Opener: {candidate.aiOpener}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {candidate.profile.trustBadges?.map((badge) => (
              <Badge key={badge} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>
          <div className="mt-auto flex items-center gap-3 pt-10">
            <Button variant="outline" className="flex-1 gap-2">
              Pass
            </Button>
            <Button
              className="flex-1 gap-2"
              disabled={pendingTargetId === candidate.candidateId}
              onClick={() => onLike(candidate.candidateId)}
            >
              <Heart className="h-4 w-4" /> Like
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Super like"
              disabled={pendingTargetId === candidate.candidateId}
              onClick={() => onSuperLike(candidate.candidateId)}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </article>
      ))}
    </div>
  )
}

function StoryModeGrid({ panels }: { panels: Array<Candidate & { contextPanel: string }> }) {
  if (!panels.length) return null
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {panels.map((panel) => (
        <Card key={panel.candidateId} className="rounded-3xl border border-border/70 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Flame className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">{panel.profile.name}</p>
              <p className="text-xs text-muted-foreground">{panel.profile.location?.city ?? 'Passport'} experiences</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{panel.contextPanel}</p>
          <div className="mt-6 space-y-1 text-xs">
            <p>Opener: {panel.aiOpener}</p>
            <p>Score mix: culture {Math.round((panel.scoreBreakdown.culture ?? 0) * 100)}%</p>
          </div>
        </Card>
      ))}
    </div>
  )
}

function AdvancedFilters({
  filters,
  onChange,
  onClose,
}: {
  filters: DiscoveryFilters
  onChange: (filters: DiscoveryFilters) => void
  onClose: () => void
}) {
  const handleFaith = (value: string) => onChange({ ...filters, faithPractice: value })
  const handleGoals = (value: string) => onChange({ ...filters, lifeGoals: value ? [value] : [] })
  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Faith practice</p>
        <Select value={filters.faithPractice ?? ''} onValueChange={handleFaith}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any</SelectItem>
            <SelectItem value="daily">Daily practice</SelectItem>
            <SelectItem value="weekly">Weekly gatherings</SelectItem>
            <SelectItem value="seasonal">Seasonal</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Life goals</p>
        <Select value={filters.lifeGoals?.[0] ?? ''} onValueChange={handleGoals}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any timeline</SelectItem>
            <SelectItem value="marriage_soon">Marriage within 2y</SelectItem>
            <SelectItem value="marriage_later">Exploring pace</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Show only online now</p>
          <p className="text-xs text-muted-foreground">Uses concierge ping history</p>
        </div>
        <Switch checked={Boolean(filters.onlineNow)} onCheckedChange={(value) => onChange({ ...filters, onlineNow: value })} />
      </div>
      <Button className="w-full" onClick={onClose}>
        Apply filters
      </Button>
    </div>
  )
}
