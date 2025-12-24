'use client'

import { useEffect, useState } from 'react'

export function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      // Get scroll position
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
      
      // Calculate percentage
      const scrollPercent = (scrollTop / docHeight) * 100
      
      setProgress(Math.min(Math.max(scrollPercent, 0), 100))
    }

    // Update on scroll
    window.addEventListener('scroll', updateProgress, { passive: true })
    
    // Initial update
    updateProgress()

    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-neutral-200">
      <div
        className="h-full bg-gradient-to-r from-gold-warm via-gold-warm-light to-gold-warm transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
