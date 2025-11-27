'use client'

import * as React from 'react'
import { Heart, MapPin, ShieldCheck } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PremiumProfileCardProps {
  profile: {
    id?: string
    name: string
    age: number
    tribe?: string
    location?: string
    photo?: string
    bio?: string
    verified?: boolean
    interests?: string[]
  }
  matchScore?: number
  onLike?: () => void
  onPass?: () => void
  className?: string
}

export function PremiumProfileCard({
  profile,
  matchScore = 85,
  onLike,
  onPass,
  className,
}: PremiumProfileCardProps) {
  return (
    <Card 
      variant="premium" 
      padding="none"
      className={cn("max-w-sm mx-auto overflow-hidden group", className)}
    >
      {/* Image with gradient overlay */}
      <div className="relative h-[400px] overflow-hidden">
        <img 
          src={profile.photo || "/placeholder.svg"}
          alt={profile.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
        
        {/* Match Score Badge */}
        {matchScore && (
          <div className="absolute top-4 right-4 bg-gold-gradient px-4 py-2 rounded-full shadow-glow-gold">
            <span className="text-sm font-bold text-bg-primary">
              {matchScore}% Match
            </span>
          </div>
        )}
        
        {/* Verified Badge */}
        {profile.verified && (
          <div className="absolute top-4 left-4 bg-purple-gradient px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gold-warm" />
            <span className="text-xs font-semibold text-text-primary">Verified</span>
          </div>
        )}
        
        {/* Profile Info - Overlaid on image */}
        <div className="absolute inset-x-0 bottom-0 p-6 text-text-primary">
          <h3 className="text-2xl font-bold mb-1">
            {profile.name}, {profile.age}
          </h3>
          {profile.tribe && (
            <p className="text-sm text-gold-warm uppercase tracking-wider font-semibold mb-2">
              {profile.tribe}
            </p>
          )}
          {profile.location && (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <MapPin className="w-4 h-4" />
              <span>{profile.location}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Bio Section */}
      <div className="p-6 bg-bg-secondary">
        {profile.bio && (
          <p className="text-sm text-text-secondary mb-4 line-clamp-2">
            {profile.bio}
          </p>
        )}
        
        {/* Interest Tags */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {profile.interests.slice(0, 3).map(interest => (
              <span 
                key={interest}
                className="px-3 py-1 bg-purple-royal/20 border border-purple-royal/40 rounded-full text-xs text-text-primary"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
        
        {/* Action Buttons */}
        {(onLike || onPass) && (
          <div className="flex gap-3">
            {onPass && (
              <Button 
                variant="outline" 
                size="lg" 
                className="flex-1"
                onClick={onPass}
              >
                Pass
              </Button>
            )}
            {onLike && (
              <Button 
                variant="gold" 
                size="lg" 
                className="flex-1"
                onClick={onLike}
              >
                <Heart className="w-5 h-5 mr-2" />
                Like
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
