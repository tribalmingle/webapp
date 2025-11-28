"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Heart, MessageCircle, User, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileBottomNavProps {
  chatBadgeCount?: number
}

const MOBILE_NAV_ITEMS = [
  { label: 'Home', href: '/dashboard-spa', icon: Home },
  { label: 'Likes', href: '/likes', icon: Heart },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
  { label: 'Profile', href: '/profile', icon: User },
]

export function MobileBottomNav({ chatBadgeCount }: MobileBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 lg:hidden">
      <div className="bg-background/95 backdrop-blur-md border border-border/50 rounded-[15px] shadow-lg px-2 py-3">
        <div className="flex justify-around items-center gap-2">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
            const badge = item.href === '/chat' ? chatBadgeCount : undefined
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all flex-1 min-h-[60px]",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  <Icon className={cn("w-6 h-6", isActive && "text-primary")} />
                  {badge && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "text-[11px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
