'use client'

import { Home, Heart, MessageSquare, User } from 'lucide-react'
import { useState, useEffect } from 'react'

interface BottomNavProps {
  activeView: string
  onNavigate: (view: string) => void
}

export function BottomNavSPA({ activeView, onNavigate }: BottomNavProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/messages/conversations')
        if (response.ok) {
          const data = await response.json()
          if (data.conversations) {
            // Count conversations with unread messages
            const unread = data.conversations.filter((conv: any) => conv.unread > 0).length
            setUnreadCount(unread)
          }
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }

    fetchUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'likes', icon: Heart, label: 'Likes' },
    { id: 'chat', icon: MessageSquare, label: 'Chat', badge: unreadCount > 0 ? unreadCount : undefined },
    { id: 'profile', icon: User, label: 'Profile' }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-purple-900 border-t border-purple-800 rounded-t-2xl z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`relative flex flex-col items-center justify-center gap-1 py-4 px-4 sm:px-6 transition font-bold ${
                  isActive 
                    ? 'text-orange-500' 
                    : 'text-orange-400 hover:text-orange-300'
                }`}
              >
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
                <span className="text-xs md:text-sm lg:text-base font-bold">{item.label}</span>
                {item.badge && (
                  <span className="absolute top-2 right-2 min-w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold px-1.5">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
