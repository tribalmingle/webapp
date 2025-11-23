"use client"

import Link from 'next/link'
import { Users } from 'lucide-react'

import type { ClubSummary } from '@/lib/services/community-service'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ClubCard({ club }: { club: ClubSummary }) {
  const colorClass = club.accentColor ? getAccentClass(club.accentColor) : 'from-rose-100 to-white'

  return (
    <Card className="relative flex flex-col gap-4 rounded-3xl border border-border/60 p-5">
      <div className={cn('absolute inset-x-4 top-4 h-24 rounded-3xl bg-gradient-to-r opacity-40 blur-3xl', colorClass)} aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{club.guardianOnly ? 'Guardian Circle' : 'Community Club'}</p>
          <h3 className="text-2xl font-semibold">{club.name}</h3>
          {club.tagline && <p className="text-sm text-muted-foreground">{club.tagline}</p>}
        </div>
        <Badge variant={club.guardianOnly ? 'destructive' : 'outline'}>{club.guardianOnly ? 'Guardian only' : 'Open'}</Badge>
      </div>
      <p className="relative text-sm text-muted-foreground line-clamp-3">{club.description}</p>
      <div className="flex flex-wrap gap-2">
        {club.tags.slice(0, 4).map((tag) => (
          <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary">
            #{tag}
          </Badge>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{club.memberCount.toLocaleString()} members</span>
        </div>
        {club.upcomingAma && (
          <span>
            Next AMA · {new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(club.upcomingAma.startAt))}
          </span>
        )}
      </div>
      <Button asChild className="mt-auto">
        <Link href={`/community/clubs/${club.slug}`}>Enter club</Link>
      </Button>
    </Card>
  )
}

function getAccentClass(accent: string) {
  switch (accent) {
    case 'sunset':
      return 'from-orange-100 to-pink-50'
    case 'forest':
      return 'from-emerald-100 to-slate-50'
    case 'midnight':
      return 'from-slate-900/30 to-slate-800/10'
    default:
      return 'from-rose-50 to-white'
  }
}
