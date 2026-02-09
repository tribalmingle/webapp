'use client'

import Link from 'next/link'
import { Search, Settings } from 'lucide-react'

interface HeaderProps {
  onSearchClick?: () => void
  onSettingsClick?: () => void
}

export function Header({ onSearchClick, onSettingsClick }: HeaderProps = {}) {
  return (
    <header className="fixed top-0 left-0 right-0 border-b border-border-gold/20 z-40">
      {/* Animated gradient background matching hero */}
      <div className="absolute inset-0 bg-hero-gradient">
        <div className="absolute top-0 left-20 w-64 h-64 bg-purple-royal/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-0 right-20 w-64 h-64 bg-gold-warm/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/dashboard-spa" className="flex items-center w-auto">
          <img src="/triballogo.png" alt="Tribal Mingle" className="h-[60px] w-full object-contain" />
        </Link>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onSearchClick}
            className="p-2 hover:bg-gold-warm/10 rounded-lg transition active:scale-95"
            aria-label="Search users"
          >
            <Search className="w-5 h-5 text-text-primary" />
          </button>
          <button 
            onClick={onSettingsClick}
            className="p-2 hover:bg-gold-warm/10 rounded-lg transition active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-text-primary" />
          </button>
        </div>
      </div>
    </header>
  )
}
