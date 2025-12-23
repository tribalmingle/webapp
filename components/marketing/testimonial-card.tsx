'use client'

import { useState } from 'react'
import { Star, Shield, Play } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface TestimonialCardProps {
  id: string
  name: string
  location?: string
  tribe?: string
  quote: string
  rating?: number
  hasVideo?: boolean
  index: number
}

export function TestimonialCard({
  id,
  name,
  location,
  tribe,
  quote,
  rating = 5,
  hasVideo = false,
  index,
}: TestimonialCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  // Slight rotation for Polaroid effect (alternate between left and right)
  const rotation = index % 2 === 0 ? -2 : 2

  return (
    <div
      className="group h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        animationDelay: `${index * 150}ms`,
      }}
    >
      {/* Polaroid-style card */}
      <div
        className={cn(
          "relative h-full bg-white rounded-lg p-6 shadow-xl border border-neutral-100 transition-all duration-500",
          "hover:shadow-2xl hover:scale-105 hover:z-10"
        )}
        style={{
          transform: isHovered ? 'rotate(0deg)' : `rotate(${rotation}deg)`,
        }}
      >
        {/* Top section: Profile with double ring */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative shrink-0">
            {/* Double ring border (gold + purple gradient) */}
            <div className="absolute inset-0 rounded-full p-0.5 bg-gradient-to-br from-gold-warm via-purple-royal to-gold-warm animate-spin-slow">
              <div className="h-full w-full rounded-full bg-white" />
            </div>
            
            {/* Inner profile circle */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-royal to-purple-600 text-white font-display text-xl font-bold shadow-lg">
              {name.charAt(0)}
            </div>
            
            {/* Verified checkmark with animation */}
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-2 border-white shadow-md animate-pulse-slow">
              <Shield className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-display text-lg font-bold text-neutral-900 truncate">{name}</p>
              <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0 h-5 border-green-200 text-green-700 bg-green-50">
                Verified
              </Badge>
            </div>
            <p className="text-body-sm text-neutral-500 font-medium truncate">
              {[location, tribe].filter(Boolean).join(' • ')}
            </p>
          </div>
        </div>

        {/* Quote section with decorative quotes */}
        <div className="relative flex-1 mb-6">
          {/* Large opening quote */}
          <span className="absolute -top-2 -left-1 text-6xl text-gold-warm opacity-20 font-serif leading-none">"</span>
          
          {/* Quote text in handwriting-style */}
          <p className="relative z-10 text-body-lg text-neutral-700 leading-relaxed pl-8">
            <span className="italic">{quote}</span>
          </p>
          
          {/* Closing quote */}
          <span className="absolute -bottom-4 right-0 text-6xl text-gold-warm opacity-20 font-serif leading-none">"</span>
        </div>

        {/* Bottom section: Rating and video */}
        <div className="mt-auto flex items-center justify-between border-t border-neutral-100 pt-4">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, starIndex) => (
              <Star
                key={`${id}-star-${starIndex}`}
                className={cn(
                  "h-4 w-4 transition-all duration-300",
                  starIndex < rating ? 'text-gold-warm fill-gold-warm' : 'text-neutral-200',
                  isHovered && starIndex < rating && 'scale-110'
                )}
                style={{
                  animationDelay: `${starIndex * 100}ms`,
                }}
              />
            ))}
          </div>
          
          {hasVideo && (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-purple-royal hover:text-purple-royal-light hover:bg-purple-50 -mr-2 group-hover:animate-pulse"
                >
                  <div className="relative flex items-center">
                    <Play className="w-4 h-4 mr-2 fill-purple-royal" />
                    Watch Story
                  </div>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black border-border-gold/20">
                <div className="aspect-video w-full bg-neutral-900 flex items-center justify-center">
                  <p className="text-white/50">Video Placeholder</p>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
        
        {/* Hover overlay: "Learn more" indicator */}
        <div
          className={cn(
            "absolute bottom-4 right-4 opacity-0 transition-all duration-300",
            isHovered && "opacity-100"
          )}
        >
          <div className="flex items-center gap-1 text-sm text-purple-royal font-semibold">
            <span>Read more</span>
            <span className="animate-pulse">→</span>
          </div>
        </div>
      </div>
    </div>
  )
}
