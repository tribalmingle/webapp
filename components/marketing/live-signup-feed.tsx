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

  useEffect(() => {
    // Fetch recent signups
    fetchRecentSignups()

    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentSignups, 30000)

    // Show notification cycle
    const notificationInterval = setInterval(() => {
      setVisible(true)
      setTimeout(() => setVisible(false), 5000) // Show for 5 seconds
    }, 10000) // Every 10 seconds

    return () => {
      clearInterval(interval)
      clearInterval(notificationInterval)
    }
  }, [])

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

  const currentSignup = recentSignups[0]

  return (
    <div
      className={cn(
        'fixed bottom-6 left-6 z-40 transition-all duration-500 ease-in-out',
        visible ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0',
        className
      )}
    >
      <div className="flex items-center gap-3 bg-white border border-border-gold/20 rounded-2xl shadow-2xl p-4 max-w-sm backdrop-blur-sm">
        {/* Profile Picture or Placeholder */}
        <div className="relative shrink-0">
          {currentSignup.profileImage ? (
            <img
              src={currentSignup.profileImage}
              alt={currentSignup.firstName}
              className="w-12 h-12 rounded-full object-cover border-2 border-gold-warm"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-purple-gradient flex items-center justify-center text-white font-bold text-lg border-2 border-gold-warm">
              {currentSignup.firstName.charAt(0).toUpperCase()}
            </div>
          )}
          
          {/* Green dot indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Users className="w-4 h-4 text-purple-royal shrink-0" />
            <p className="font-semibold text-neutral-900 text-sm truncate">
              {currentSignup.firstName}
            </p>
          </div>
          <p className="text-xs text-neutral-600">
            from <span className="font-medium">{currentSignup.location}</span> just joined
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">
            {getTimeAgo(currentSignup.joinedAt)}
          </p>
        </div>

        {/* Pulse animation */}
        <div className="absolute -top-1 -right-1 w-3 h-3">
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75" />
          <div className="absolute inset-0 bg-green-500 rounded-full" />
        </div>
      </div>
    </div>
  )
}
