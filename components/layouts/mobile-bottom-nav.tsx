'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Compass, Heart, MessageCircle, User } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: string
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Home', href: '/dashboard' },
  { icon: Compass, label: 'Discover', href: '/discover' },
  { icon: Heart, label: 'Likes', href: '/likes', badge: '3' },
  { icon: MessageCircle, label: 'Chat', href: '/chat', badge: '5' },
  { icon: User, label: 'Profile', href: '/profile' },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed bottom-0 inset-x-0 lg:hidden bg-bg-secondary border-t border-gold-warm/20 shadow-premium z-50">
      <div className="flex items-center justify-around h-20 px-2 safe-area-inset-bottom">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[60px] relative"
            >
              <div className="relative">
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-all",
                    isActive ? "text-gold-warm scale-110" : "text-text-secondary"
                  )}
                />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              
              <span className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-gold-warm" : "text-text-tertiary"
              )}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-gold-gradient rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
