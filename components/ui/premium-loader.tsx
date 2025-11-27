import * as React from 'react'

import { cn } from '@/lib/utils'

interface PremiumLoaderProps {
  message?: string
  className?: string
}

export function PremiumLoader({ 
  message = "Finding your perfect match...",
  className 
}: PremiumLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[400px]", className)}>
      {/* Animated logo or icon */}
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-4 border-gold-warm/20 animate-spin">
          <div className="absolute top-0 left-0 w-4 h-4 bg-gold-gradient rounded-full" />
        </div>
        
        {/* Pulsing glow */}
        <div className="absolute inset-0 rounded-full bg-gold-warm/20 animate-pulse blur-xl" />
      </div>
      
      {message && (
        <p className="mt-6 text-sm text-text-secondary animate-pulse">
          {message}
        </p>
      )}
    </div>
  )
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }
  
  return (
    <div 
      className={cn(
        "rounded-full border-gold-warm/20 border-t-gold-warm animate-spin",
        sizeClasses[size],
        className
      )}
    />
  )
}
