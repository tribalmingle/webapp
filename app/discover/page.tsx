"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DiscoverRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard-spa?view=discover')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to discover...</p>
    </div>
  )
}

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/premium/stat-card'
import { StaggerGrid, FadeIn, ScaleIn, SlideUp } from '@/components/motion'
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

        <FadeIn delay={0.2}>
          <Card variant="glass" className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="gold" className="shrink-0">
                  <Zap className="w-3 h-3 mr-1" />
                  Discovery Mode
                </Badge>
                <div className="flex gap-2">
                  <Button
                    variant={mode === 'swipe' ? 'primary' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => setMode('swipe')}
                  >
                    <Sparkles className="h-4 w-4" /> Swipe Stack
                  </Button>
                  <Button
                    variant={mode === 'story' ? 'primary' : 'outline'}
                    size="sm"
                    className="gap-2"
                    onClick={() => setMode('story')}
                  >
                    <SwitchCamera className="h-4 w-4" /> Story Grid
                  </Button>
                </div>
              </div>
              
              <div className="ml-auto flex items-center gap-2">
                <Select value={selectedRecipe ?? 'current'} onValueChange={(value) => setSelectedRecipe(value === 'current' ? null : value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select recipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current filters</SelectItem>
                    {feed?.recipes.map((recipe) => (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="sm" onClick={handleSaveRecipe} className="gap-2">
                  <Save className="h-4 w-4" /> Save
                </Button>
              </div>
            </div>
          </Card>
        </FadeIn>

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
        'rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-300',
        active 
          ? 'border-purple-royal bg-purple-royal/20 text-purple-royal shadow-sm scale-105' 
          : 'border-border-gold/30 bg-background-secondary text-text-secondary hover:text-text-primary hover:border-border-gold/50 hover:bg-background-tertiary',
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
  const activeBoosts = boostStrip?.active.length ?? 0
  const hasActiveBoost = activeBoosts > 0
  
  return (
    <SlideUp>
      <StaggerGrid columns={3}>
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          title="Today's Matches"
          value={loading ? 0 : total}
          trendLabel={generatedAt ? `Refreshed ${new Date(generatedAt).toLocaleTimeString()}` : 'Loading...'}
          variant="premium"
        />
        <StatCard
          icon={hasActiveBoost ? <Flame className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
          title={hasActiveBoost ? "Active Boosts" : "Boost Status"}
          value={activeBoosts}
          trendLabel={hasActiveBoost ? `Ends ${new Date(boostStrip!.active[0].endsAt).toLocaleTimeString()}` : 'Spotlight available'}
          variant="premium"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          title="Concierge Picks"
          value={loading ? 0 : total}
          trendLabel="AI-curated for you"
          variant="premium"
        />
      </StaggerGrid>
    </SlideUp>
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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  
  if (!candidates.length) {
    return (
      <FadeIn>
        <Card variant="glass" className="border-2 border-dashed border-border-gold/30 p-16 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-purple-royal/20 flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-purple-royal" />
          </div>
          <h3 className="text-h3 font-display text-text-primary mb-2">No Matches Available</h3>
          <p className="text-body text-text-secondary max-w-md mx-auto">
            Try adjusting your filters or check back later for fresh matches
          </p>
        </Card>
      </FadeIn>
    )
  }

  const currentCandidate = candidates[currentIndex]
  const stackers = candidates.slice(currentIndex, currentIndex + 3)
  
  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction)
    
    setTimeout(() => {
      if (direction === 'right') {
        onLike(currentCandidate.candidateId)
      }
      setCurrentIndex(prev => prev + 1)
      setSwipeDirection(null)
    }, 300)
  }
  
  const handleSuperLikeClick = () => {
    onSuperLike(currentCandidate.candidateId)
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1)
    }, 500)
  }

  if (currentIndex >= candidates.length) {
    return (
      <ScaleIn>
        <Card variant="premium" className="p-16 text-center">
          <div className="mx-auto w-24 h-24 rounded-full bg-gold-gradient flex items-center justify-center mb-6 shadow-glow-gold">
            <Crown className="w-12 h-12 text-background-primary" />
          </div>
          <h3 className="text-h2 font-display text-text-primary mb-3">You've Seen Everyone!</h3>
          <p className="text-body text-text-secondary max-w-md mx-auto mb-8">
            Check back tomorrow for fresh matches or adjust your filters to see more
          </p>
          <Button variant="gold" size="lg" onClick={() => setCurrentIndex(0)}>
            Review Matches
            <Sparkles className="ml-2 w-5 h-5" />
          </Button>
        </Card>
      </ScaleIn>
    )
  }

  return (
    <div className="relative h-[600px] max-w-2xl mx-auto">
      {stackers.map((candidate, index) => {
        const isTop = index === 0
        const zIndex = 10 - index
        const scale = 1 - index * 0.05
        const translateY = index * 20
        const opacity = 1 - index * 0.3
        
        const swipeTransform = isTop && swipeDirection 
          ? swipeDirection === 'right' 
            ? 'translateX(150%) rotate(20deg)'
            : 'translateX(-150%) rotate(-20deg)'
          : ''

        return (
          <FadeIn key={candidate.candidateId} delay={index * 0.1}>
            <article
              className={cn(
                "absolute inset-0 transition-all duration-500 ease-out",
                isTop && "cursor-grab active:cursor-grabbing"
              )}
              style={{
                transform: swipeTransform || `translateY(${translateY}px) scale(${scale})`,
                zIndex,
                opacity,
                transition: swipeDirection ? 'transform 0.3s ease-out' : 'all 0.5s ease-out'
              }}
            >
              <Card variant="glass" className="h-full flex flex-col overflow-hidden shadow-premium">
                {/* Profile Image Section */}
                <div className="relative h-96 bg-linear-to-br from-purple-royal/20 to-gold-warm/20 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                  
                  {/* Match Score Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <Badge variant="premium" className="text-sm px-3 py-1.5">
                      <Star className="w-4 h-4 mr-1" fill="currentColor" />
                      {Math.round(candidate.matchScore * 100)}% Match
                    </Badge>
                  </div>
                  
                  {/* Verification Badge */}
                  {candidate.profile.verificationStatus?.badgeIssuedAt && (
                    <div className="absolute top-4 left-4 z-10">
                      <Badge variant="gold">
                        <Crown className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  )}
                  
                  {/* Boost Context */}
                  {candidate.boostContext && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge variant="info" className="w-full justify-center">
                        <Flame className="w-3 h-3 mr-1" />
                        {candidate.boostContext.placement}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Profile Info Section */}
                <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                  {/* Name and Location */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-h2 font-display text-text-primary">
                        {candidate.profile.name}
                        {candidate.profile.age && (
                          <span className="text-text-secondary">, {candidate.profile.age}</span>
                        )}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-text-secondary">
                      <MapPin className="w-4 h-4" />
                      <span className="text-body-sm">
                        {candidate.profile.location?.city ?? 'Global'} • {candidate.profile.tribe}
                      </span>
                    </div>
                  </div>

                  {/* Concierge Prompt */}
                  <Card variant="flat" className="p-4 bg-purple-royal/10 border-purple-royal/30">
                    <p className="text-label text-purple-royal mb-2">AI Insight</p>
                    <p className="text-body-sm text-text-primary">{candidate.conciergePrompt}</p>
                  </Card>

                  {/* AI Opener */}
                  <div>
                    <p className="text-label text-text-tertiary mb-2">Suggested Opener</p>
                    <p className="text-body-sm text-text-secondary italic">"{candidate.aiOpener}"</p>
                  </div>

                  {/* Trust Badges */}
                  {candidate.profile.trustBadges && candidate.profile.trustBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {candidate.profile.trustBadges.map((badge) => (
                        <Badge key={badge} variant="outline">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Match Score Breakdown */}
                  <div className="pt-4 border-t border-border-gold/20">
                    <p className="text-label text-text-tertiary mb-3">Compatibility Breakdown</p>
                    <div className="space-y-2">
                      {Object.entries(candidate.scoreBreakdown).slice(0, 3).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-body-sm text-text-secondary capitalize w-24">{key}</span>
                          <div className="flex-1 h-2 bg-background-tertiary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gold-gradient rounded-full transition-all duration-1000"
                              style={{ width: `${Math.round((value ?? 0) * 100)}%` }}
                            />
                          </div>
                          <span className="text-body-sm font-semibold text-gold-warm w-12 text-right">
                            {Math.round((value ?? 0) * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Only show on top card */}
                {isTop && (
                  <div className="p-6 pt-0">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 group"
                        onClick={() => handleSwipe('left')}
                        disabled={pendingTargetId === candidate.candidateId}
                      >
                        <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Pass
                      </Button>
                      
                      <Button
                        variant="gold"
                        size="icon-lg"
                        onClick={handleSuperLikeClick}
                        disabled={pendingTargetId === candidate.candidateId}
                        className="shadow-glow-gold"
                      >
                        <Star className="w-6 h-6" fill="currentColor" />
                      </Button>
                      
                      <Button
                        variant="primary"
                        size="lg"
                        className="flex-1 group"
                        onClick={() => handleSwipe('right')}
                        disabled={pendingTargetId === candidate.candidateId}
                      >
                        <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" fill="currentColor" />
                        Like
                      </Button>
                    </div>
                    
                    <p className="text-center text-body-xs text-text-tertiary mt-3">
                      {candidates.length - currentIndex - 1} matches remaining
                    </p>
                  </div>
                )}
              </Card>
            </article>
          </FadeIn>
        )
      })}
    </div>
  )
}

function StoryModeGrid({ panels }: { panels: Array<Candidate & { contextPanel: string }> }) {
  if (!panels.length) {
    return (
      <FadeIn>
        <Card variant="glass" className="border-2 border-dashed border-border-gold/30 p-16 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-gold-warm/20 flex items-center justify-center mb-6">
            <SwitchCamera className="w-10 h-10 text-gold-warm" />
          </div>
          <h3 className="text-h3 font-display text-text-primary mb-2">No Story Panels</h3>
          <p className="text-body text-text-secondary max-w-md mx-auto">
            Switch to swipe mode or adjust your filters
          </p>
        </Card>
      </FadeIn>
    )
  }
  
  return (
    <StaggerGrid columns={3}>
      {panels.map((panel, index) => (
        <FadeIn key={panel.candidateId} delay={index * 0.1}>
          <Card variant="glass" className="p-6 card-lift cursor-pointer group">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center shadow-glow-gold">
                <Flame className="w-6 h-6 text-background-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-h4 text-text-primary font-semibold truncate">
                    {panel.profile.name}
                  </p>
                  {panel.profile.verificationStatus?.badgeIssuedAt && (
                    <Crown className="w-4 h-4 text-gold-warm shrink-0" />
                  )}
                </div>
                <p className="text-body-xs text-text-tertiary truncate">
                  {panel.profile.location?.city ?? 'Passport'} Experiences
                </p>
              </div>
              <Badge variant="gold" className="shrink-0">
                {Math.round(panel.matchScore * 100)}%
              </Badge>
            </div>

            {/* Story Context */}
            <Card variant="flat" className="p-4 mb-4 bg-purple-royal/5 border-purple-royal/20">
              <p className="text-body-sm text-text-primary line-clamp-3">
                {panel.contextPanel}
              </p>
            </Card>

            {/* Details */}
            <div className="space-y-2 text-body-xs text-text-secondary">
              <div className="flex items-start gap-2">
                <MessageCircle className="w-4 h-4 text-gold-warm shrink-0 mt-0.5" />
                <p className="italic line-clamp-2">"{panel.aiOpener}"</p>
              </div>
              
              {/* Score breakdown */}
              <div className="flex items-center gap-2 pt-2 border-t border-border-gold/10">
                <TrendingUp className="w-4 h-4 text-purple-royal" />
                <span className="text-text-tertiary">Culture match:</span>
                <span className="font-semibold text-purple-royal">
                  {Math.round((panel.scoreBreakdown.culture ?? 0) * 100)}%
                </span>
              </div>
            </div>

            {/* Action Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4 group-hover:bg-purple-royal/10 group-hover:border-purple-royal/40 transition-colors"
            >
              View Profile
              <Sparkles className="ml-2 w-4 h-4" />
            </Button>
          </Card>
        </FadeIn>
      ))}
    </StaggerGrid>
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
