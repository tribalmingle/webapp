'use client'

import { Heart, Star, MessageCircle, Zap } from 'lucide-react'
import Link from 'next/link'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { useAuth } from '@/contexts/auth-context'

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const userName = user?.name?.split(' ')[0] || 'there'
  
  return (
    <MemberAppShell
      title={`Hey ${userName}`}
      description="Here is what your tribe has been up to."
    >
      <div className="space-y-8">
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Heart, label: 'Likes', value: '12', color: 'text-red-500' },
            { icon: MessageCircle, label: 'Messages', value: '5', color: 'text-blue-500' },
            { icon: Star, label: 'Visits', value: '28', color: 'text-yellow-500' },
            { icon: Zap, label: 'Matches', value: '3', color: 'text-purple-500' }
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="rounded-2xl border border-border bg-card/80 p-5 text-center shadow-sm">
                <Icon className={`mx-auto mb-2 h-6 w-6 ${stat.color}`} />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            )
          })}
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Daily spotlight</p>
              <h2 className="text-2xl font-semibold">Today's matches for you</h2>
            </div>
            <Link href="/discover" className="text-sm font-semibold text-accent hover:underline">
              See all matches
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: 'Emma', age: 32, tribe: 'Igbo', match: 94, image: '/woman-portrait.jpg' },
              { name: 'Jessica', age: 29, tribe: 'Ashanti', match: 88, image: '/woman-fitness.png' },
              { name: 'Lisa', age: 35, tribe: 'Ga', match: 85, image: '/woman-artist.jpg' }
            ].map(match => (
              <div key={match.name} className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                <img src={match.image || "/placeholder.svg"} alt={match.name} className="h-64 w-full object-cover" />
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{match.name}, {match.age}</h3>
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent">{match.tribe}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Match score</p>
                      <p className="text-xl font-bold text-accent">{match.match}%</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition hover:bg-muted">
                      Skip
                    </button>
                    <button className="flex-1 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90">
                      Like
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Who likes you</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { name: 'Michelle', tribe: 'Yoruba', bio: 'Love hiking and coffee' },
              { name: 'Rachel', tribe: 'Zulu', bio: 'Artist and yoga enthusiast' }
            ].map(liker => (
              <div
                key={liker.name}
                className="flex items-center justify-between rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-transparent to-accent/10 p-4"
              >
                <div>
                  <h3 className="text-base font-semibold">{liker.name}</h3>
                  <p className="text-xs font-semibold uppercase tracking-wide text-accent">{liker.tribe}</p>
                  <p className="text-xs text-muted-foreground">{liker.bio}</p>
                </div>
                <button className="rounded-xl bg-card px-4 py-2 text-sm font-semibold text-accent transition hover:bg-card/80">
                  View
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MemberAppShell>
  )
}
