'use client'

import { Home, Heart, MessageSquare, User } from 'lucide-react'

interface BottomNavProps {
  activeView: string
  onNavigate: (view: string) => void
}

export function BottomNavSPA({ activeView, onNavigate }: BottomNavProps) {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'likes', icon: Heart, label: 'Likes' },
    { id: 'chat', icon: MessageSquare, label: 'Chat' },
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
                className={`flex flex-col items-center justify-center gap-1 py-4 px-4 sm:px-6 transition font-bold ${
                  isActive 
                    ? 'text-orange-500' 
                    : 'text-orange-400 hover:text-orange-300'
                }`}
              >
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
                <span className="text-xs md:text-sm lg:text-base font-bold">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
