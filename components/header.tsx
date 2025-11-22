'use client'

import Link from 'next/link'
import { Search, Settings } from 'lucide-react'

interface HeaderProps {
  onSearchClick?: () => void
  onSettingsClick?: () => void
}

export function Header({ onSearchClick, onSettingsClick }: HeaderProps = {}) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-purple-900 border-b border-purple-800 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <Link href="/dashboard-spa" className="flex items-center w-auto">
          <img src="/triballogo.png" alt="Tribal Mingle" className="h-[60px] w-full object-contain" />
        </Link>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onSearchClick}
            className="p-2 hover:bg-purple-800 rounded-lg transition active:scale-95"
            aria-label="Search users"
          >
            <Search className="w-5 h-5 text-white" />
          </button>
          <button 
            onClick={onSettingsClick}
            className="p-2 hover:bg-purple-800 rounded-lg transition active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  )
}
