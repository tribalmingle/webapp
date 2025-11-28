'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, MessageSquare, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  const pathname = usePathname()
  
  const navItems = [
    { label: 'Home', href: '/dashboard-spa', icon: Home },
    { label: 'Likes', href: '/likes', icon: Heart },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Profile', href: '/profile', icon: User }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-purple-900 border-t border-purple-800 rounded-t-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-around">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-4 px-4 sm:px-6 transition",
                  "text-orange-600 font-bold hover:text-orange-500"
                )}
              >
                <Icon className="w-6 h-6 md:w-8 md:h-8" />
                <span className="text-xs md:text-sm lg:text-base font-bold">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
