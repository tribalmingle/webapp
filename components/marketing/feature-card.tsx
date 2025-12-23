'use client'

import { useState } from 'react'
import { Heart, Shield, Star, Users, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

const ICON_MAP = {
  zap: Zap,
  shield: Shield,
  heart: Heart,
  users: Users,
  star: Star,
}

interface FeatureCardProps {
  iconName: keyof typeof ICON_MAP
  title: string
  description: string
  index: number
}

export function FeatureCard({ iconName, title, description, index }: FeatureCardProps) {
  const Icon = ICON_MAP[iconName] ?? Zap
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className="group relative h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        animationDelay: `${index * 100}ms`,
      }}
    >
      {/* Animated gradient border (visible on hover) */}
      <div 
        className={cn(
          "absolute -inset-0.5 rounded-2xl opacity-0 blur-sm transition-all duration-500",
          isHovered && "opacity-75 animate-gradient-flow"
        )}
        style={{
          background: 'linear-gradient(90deg, #FFD700, #8B5CF6, #FFD700)',
          backgroundSize: '200% 100%'
        }}
      />
      
      {/* Main card */}
      <div className={cn(
        "relative h-full bg-white rounded-2xl p-6 md:p-8 border border-neutral-100 shadow-lg transition-all duration-300",
        isHovered && "transform -translate-y-2 shadow-2xl"
      )}>
        {/* Icon with glow background */}
        <div className={cn(
          "w-14 h-14 rounded-xl bg-gold-gradient flex items-center justify-center shadow-md transition-all duration-300 mb-4",
          isHovered && "scale-110 shadow-glow-gold rotate-6"
        )}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        
        {/* Content */}
        <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">
          {title}
        </h3>
        <p className="text-sm md:text-base text-neutral-600 leading-relaxed">
          {description}
        </p>
        
        {/* Hover indicator */}
        <div className={cn(
          "mt-4 text-sm font-semibold text-purple-royal flex items-center gap-2 opacity-0 transition-opacity duration-300",
          isHovered && "opacity-100"
        )}>
          <span>Learn more</span>
          <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
