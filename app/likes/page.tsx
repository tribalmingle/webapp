'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LikesRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard-spa?view=likes')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to likes...</p>
    </div>
  )
}

import { useState, useEffect, type ReactNode } from 'react'
import { Heart, Eye, Clock, X, Star } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'

// Utility helpers moved to module scope so child components can reuse them
const formatDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  return `${hours}h`
}

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}

interface LikeData {
  _id: string
  userId: string
  name: string
  age: number
  city: string
  tribe: string
  profilePhoto: string
  likedAt: string
}

interface ViewData {
  _id: string
  userId: string
  name: string
  age: number
  city: string
  tribe: string
  profilePhoto: string
  viewedAt: string
  duration: number // in seconds
}

export default function LikesPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'liked' | 'likedMe' | 'views'>('likedMe')
  const [loading, setLoading] = useState(false)
  const [peopleILiked, setPeopleILiked] = useState<LikeData[]>([])
  const [peopleWhoLikedMe, setPeopleWhoLikedMe] = useState<LikeData[]>([])
  const [profileViews, setProfileViews] = useState<ViewData[]>([])

  useEffect(() => {
    if (user) {
      fetchLikesData()
    }
  }, [user])

  const fetchLikesData = async () => {
    setLoading(true)
    try {
      // Fetch people I liked
      const likedResponse = await fetch('/api/likes/i-liked', { credentials: 'include' })
      const likedData = await likedResponse.json()
      if (likedData.success) {
        setPeopleILiked(likedData.likes)
      }

      // Fetch people who liked me
      const likedMeResponse = await fetch('/api/likes/liked-me', { credentials: 'include' })
      const likedMeData = await likedMeResponse.json()
      if (likedMeData.success) {
        setPeopleWhoLikedMe(likedMeData.likes)
      }

      // Fetch profile views
      const viewsResponse = await fetch('/api/profile/views', { credentials: 'include' })
      const viewsData = await viewsResponse.json()
      if (viewsData.success) {
        setProfileViews(viewsData.views)
      }
    } catch (error) {
      console.error('Error fetching likes data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUnlike = async (userId: string) => {
    try {
      const response = await fetch('/api/likes/unlike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      })

      const data = await response.json()
      if (data.success) {
        setPeopleILiked(prev => prev.filter(p => p.userId !== userId))
      }
    } catch (error) {
      console.error('Error unliking:', error)
    }
  }

  const handleLikeBack = async (userId: string) => {
    try {
      const response = await fetch('/api/likes/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      })

      const data = await response.json()
      if (data.success) {
        // Refresh data
        fetchLikesData()
      }
    } catch (error) {
      console.error('Error liking back:', error)
    }
  }

  

  const tabs = [
    { id: 'likedMe', label: 'Who Liked Me', count: peopleWhoLikedMe.length, icon: Heart },
    { id: 'liked', label: 'I Liked', count: peopleILiked.length, icon: Heart },
    { id: 'views', label: 'Profile Views', count: profileViews.length, icon: Eye }
  ]

  return (
    <MemberAppShell
      title="Likes & Views"
      description="Track who is engaging with your profile and respond faster."
      actions={
        <Button variant="secondary" className="gap-2">
          <Star className="h-4 w-4" />
          Boost visibility
        </Button>
      }
    >
      <div className="space-y-8">
        <div className="flex gap-2 overflow-x-auto rounded-3xl border border-border bg-card/60 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  selected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                <span className="rounded-full bg-background/30 px-2 text-xs">{tab.count}</span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Loading recent activity…</p>
          </div>
        ) : (
          <>
            {activeTab === 'likedMe' && (
              <LikesGrid
                items={peopleWhoLikedMe}
                emptyTitle="No likes yet"
                emptyDescription="Keep exploring and updating your profile for more matches."
                onPrimary={(person) => handleLikeBack(person.userId)}
                primaryLabel="Like back"
                primaryIcon={<Heart className="h-4 w-4" />}
                secondaryLabel="View"
              />
            )}
            {activeTab === 'liked' && (
              <LikesGrid
                items={peopleILiked}
                emptyTitle="You haven't liked anyone yet"
                emptyDescription="Start discovering profiles to build momentum."
                onSecondary={(person) => handleUnlike(person.userId)}
                primaryLabel="View profile"
                secondaryIcon={<X className="h-4 w-4" />}
                secondaryVariant="destructive"
              />
            )}
            {activeTab === 'views' && (
              <ViewsList
                items={profileViews}
              />
            )}
          </>
        )}
      </div>
    </MemberAppShell>
  )
}

function LikesGrid({
  items,
  emptyTitle,
  emptyDescription,
  onPrimary,
  onSecondary,
  primaryLabel,
  primaryIcon,
  secondaryLabel,
  secondaryIcon,
  secondaryVariant = 'outline',
}: {
  items: LikeData[]
  emptyTitle: string
  emptyDescription: string
  onPrimary?: (person: LikeData) => void
  onSecondary?: (person: LikeData) => void
  primaryLabel: string
  primaryIcon?: ReactNode
  secondaryLabel?: string
  secondaryIcon?: ReactNode
  secondaryVariant?: 'outline' | 'destructive'
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 py-16 text-center">
        <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">{emptyTitle}</p>
        <p className="text-sm text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {items.map((person) => (
        <div key={person._id} className="overflow-hidden rounded-3xl border border-border bg-card/80 shadow-sm">
          {person.profilePhoto ? (
            <img src={person.profilePhoto} alt={person.name} className="h-64 w-full object-cover" />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-linear-to-br from-primary to-accent text-5xl font-bold text-white">
              {person.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-3 p-4">
            <div>
              <h3 className="text-lg font-semibold">
                {person.name}, {person.age}
              </h3>
              <p className="text-sm text-muted-foreground">{person.city}</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">{person.tribe}</p>
            </div>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {formatTimeAgo(person.likedAt)}
            </p>
            <div className="flex gap-2">
              <Button className="flex-1 gap-2" onClick={onPrimary ? () => onPrimary(person) : undefined}>
                {primaryIcon}
                {primaryLabel}
              </Button>
              {secondaryLabel && (
                <Button
                  variant={secondaryVariant}
                  className="flex-1 gap-2"
                  onClick={onSecondary ? () => onSecondary(person) : undefined}
                >
                  {secondaryIcon}
                  {secondaryLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ViewsList({ items }: { items: ViewData[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-background/60 py-16 text-center">
        <Eye className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-semibold">No profile views yet</p>
        <p className="text-sm text-muted-foreground">Your concierge will surface new visitors soon.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((view) => (
        <div key={view._id} className="flex items-center gap-4 rounded-3xl border border-border bg-card/70 p-4">
          {view.profilePhoto ? (
            <img src={view.profilePhoto} alt={view.name} className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-accent text-2xl font-bold text-white">
              {view.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-base font-semibold">
              {view.name}, {view.age}
            </h3>
            <p className="text-sm text-muted-foreground">{view.city}</p>
            <p className="text-xs uppercase tracking-wide text-accent">{view.tribe}</p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">{formatDuration(view.duration)} on profile</p>
            <p className="mt-1 flex items-center gap-1 justify-end">
              <Clock className="h-3 w-3" /> {formatTimeAgo(view.viewedAt)}
            </p>
          </div>
          <Button variant="outline" size="sm">
            View profile
          </Button>
        </div>
      ))}
    </div>
  )
}
