'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecentSignup {
  id: string
  firstName: string
  location: string
  profileImage?: string
  joinedAt: Date
}

interface LiveSignupFeedProps {
  className?: string
}

export function LiveSignupFeed({ className }: LiveSignupFeedProps) {
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([])
  const [visible, setVisible] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    // Fetch recent signups
    fetchRecentSignups()

    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentSignups, 30000)

    // Show notification cycle
    const notificationCycle = setInterval(() => {
      setVisible(true)
      setTimeout(() => {
        setVisible(false)
        setCurrentIndex((prev) => (prev + 1) % (recentSignups.length || 1))
      }, 5000) // Show for 5 seconds
    }, 10000) // Every 10 seconds

    return () => {
      clearInterval(interval)
      clearInterval(notificationCycle)
    }
  }, [recentSignups.length])

  const fetchRecentSignups = async () => {
    try {
      const response = await fetch('/api/marketing/recent-signups')
      if (response.ok) {
        const data = await response.json()
        setRecentSignups(data.signups || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent signups:', error)
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / 60000)
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }

  if (recentSignups.length === 0) return null

  const currentSignup = recentSignups[currentIndex]

  return (
    <div
      className={cn(
        'fixed bottom-6 left-6 z-50 transition-all duration-500 ease-out',
        visible ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-[120%] opacity-0 scale-95',
        className
      )}
    >
      {/* Glassmorphism card with animated border */}
      <div className="relative group">
        {/* Animated gradient border */}
        <div 
          className="absolute -inset-0.5 rounded-2xl opacity-75 group-hover:opacity-100 blur-sm animate-gradient-flow"
          style={{
            background: 'linear-gradient(90deg, #FFD700, #8B5CF6, #FFD700)',
            backgroundSize: '200% 100%'
          }}
        />
        
        {/* Main card */}
        <div className="relative flex items-center gap-3 bg-white bg-opacity-90 backdrop-blur-xl rounded-2xl shadow-2xl p-4 max-w-sm border border-white border-opacity-20">
          {/* Profile Picture with double ring */}
          <div className="relative shrink-0">
            <div 
              className="absolute -inset-1 rounded-full animate-spin-slow"
              style={{
                background: 'linear-gradient(to right, #8B5CF6, #FFD700)'
              }}
            />
            <div className="relative">
              {currentSignup.profileImage ? (
                <img
                  src={currentSignup.profileImage}
                  alt={currentSignup.firstName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-gradient flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-lg">
                  {currentSignup.firstName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Pulsing green dot */}
            <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              <div className="absolute w-4 h-4 bg-green-500 rounded-full animate-ping" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Users className="w-4 h-4 text-purple-royal shrink-0" />
              <p className="font-bold text-neutral-900 text-sm truncate">
                {currentSignup.firstName}
              </p>
            </div>
            <p className="text-xs text-neutral-600">
              from <span className="font-semibold text-purple-royal">{currentSignup.location}</span> just joined
            </p>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-green-500" />
              {getTimeAgo(currentSignup.joinedAt)}
            </p>
          </div>

          {/* Sparkle effect */}
          <div className="absolute -top-1 -right-1">
            <div className="relative w-3 h-3">
              <div className="absolute inset-0 bg-gold-warm rounded-full animate-ping" />
              <div className="absolute inset-0 bg-gold-warm rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
