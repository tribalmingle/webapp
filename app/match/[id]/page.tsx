'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { ChevronLeft, Flag, Heart, MessageCircle, Share2 } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Button } from '@/components/ui/button'

const MATCH_PROFILE = {
  name: 'Emma Johnson',
  age: 32,
  location: 'New York, NY',
  tribe: 'Igbo',
  maritalStatus: 'Single',
  lifestyle: 'Non-smoker • Occasional drinker',
  distance: '15 miles away',
  bio: 'Creative director with a passion for art, design, and travel. Coffee enthusiast and avid reader. Looking for someone who appreciates good conversations and spontaneous adventures. Love hiking, yoga, and trying new restaurants.',
  matchScore: 94,
}

const MATCH_PHOTOS = [
  '/placeholder.svg?key=2qubz',
  '/placeholder.svg?key=e6mu9',
  '/placeholder.svg?key=vlypx',
]

const INTERESTS = ['Travel', 'Yoga', 'Art', 'Cooking', 'Reading', 'Hiking', 'Photography', 'Music']

const COMPATIBILITY_NOTES = [
  'Shared love for creative pursuits, culture, and travel itineraries.',
  'Aligned lifestyle preferences and values around family and rituals.',
  'Both optimizing for meaningful, long-term commitments.',
  'Similar age range, guardian expectations, and family readiness.',
]

export default function MatchDetailsPage() {
  const params = useParams<{ id?: string }>()
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const goPrev = () => setCurrentPhotoIndex((index) => Math.max(0, index - 1))
  const goNext = () => setCurrentPhotoIndex((index) => Math.min(MATCH_PHOTOS.length - 1, index + 1))

  return (
    <MemberAppShell
      title={`${MATCH_PROFILE.name}`}
      description={`${MATCH_PROFILE.age} • ${MATCH_PROFILE.location}`}
      actions={<ShellActions matchId={params?.id} />}
    >
      <div className="space-y-8">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/discover" className="inline-flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" /> Explore matches
          </Link>
        </Button>

        <section className="relative overflow-hidden rounded-3xl border border-border bg-card">
          <img
            src={MATCH_PHOTOS[currentPhotoIndex] || '/placeholder.svg'}
            alt="Match photo"
            className="h-[28rem] w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <CarouselButton direction="prev" disabled={currentPhotoIndex === 0} onClick={goPrev} />
            <CarouselButton
              direction="next"
              disabled={currentPhotoIndex === MATCH_PHOTOS.length - 1}
              onClick={goNext}
            />
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {MATCH_PHOTOS.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 w-10 rounded-full ${index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
          <div className="absolute right-4 top-4 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground">
            {MATCH_PROFILE.matchScore}% alignment
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-border bg-card/80 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Tribe</p>
              <p className="text-base font-semibold text-accent">{MATCH_PROFILE.tribe}</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Share2 className="h-4 w-4" /> Share profile
            </Button>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <ProfileFact label="Marital status" value={MATCH_PROFILE.maritalStatus} />
            <ProfileFact label="Lifestyle" value={MATCH_PROFILE.lifestyle} />
            <ProfileFact label="Location" value={MATCH_PROFILE.distance} />
          </dl>

          <div>
            <h2 className="text-lg font-semibold">About {MATCH_PROFILE.name.split(' ')[0]}</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{MATCH_PROFILE.bio}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Interests</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <span key={interest} className="rounded-full border border-border px-3 py-1 text-sm">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-accent/40 bg-accent/5 p-6">
          <p className="text-sm uppercase tracking-wide text-accent">Compatibility briefing</p>
          <h2 className="mt-2 text-2xl font-semibold">Why you align</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {COMPATIBILITY_NOTES.map((note) => (
              <li key={note} className="flex gap-2">
                <span className="text-accent">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </section>

        <MatchQuickActions />
      </div>
    </MemberAppShell>
  )
}

function ShellActions({ matchId }: { matchId?: string }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label={matchId ? `Actions for match ${matchId}` : undefined}>
      <Button variant="outline" size="sm" asChild>
        <Link href="/discover">Skip</Link>
      </Button>
      <Button variant="secondary" size="sm" className="gap-2">
        <MessageCircle className="h-4 w-4" /> Message
      </Button>
      <Button size="sm" className="gap-2">
        <Heart className="h-4 w-4" /> Like
      </Button>
    </div>
  )
}

function CarouselButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-black/30 px-3 py-2 text-white transition hover:bg-black/50 disabled:opacity-40"
    >
      {direction === 'prev' ? '←' : '→'}
    </button>
  )
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  )
}

function MatchQuickActions() {
  return (
    <div className="sticky bottom-4 rounded-3xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur">
      <div className="grid gap-3 md:grid-cols-4">
        <Button variant="outline" className="gap-2">
          <Flag className="h-4 w-4" /> Report
        </Button>
        <Button variant="secondary">Skip</Button>
        <Button variant="default" className="gap-2">
          <MessageCircle className="h-4 w-4" /> Message
        </Button>
        <Button className="gap-2">
          <Heart className="h-4 w-4" /> Like
        </Button>
      </div>
    </div>
  )
}
