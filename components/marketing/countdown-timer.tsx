'use client'

import { useEffect, useState } from 'react'

const END_DATE = new Date('2026-03-31T23:59:59')

export function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  function calculateTimeLeft() {
    const now = new Date()
    const diff = END_DATE.getTime() - now.getTime()
    
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 }
    
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    }
  }

  return (
    <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur px-8 py-4 rounded-full border-2 border-gold-warm/30">
      <span className="text-white/80 text-sm">⏰ Free period ends in</span>
      
      <div className="flex gap-2">
        <TimeUnit value={timeLeft.days} label="Days" />
        <span className="text-gold-warm text-2xl font-bold">:</span>
        <TimeUnit value={timeLeft.hours} label="Hrs" />
        <span className="text-gold-warm text-2xl font-bold">:</span>
        <TimeUnit value={timeLeft.minutes} label="Min" />
      </div>
    </div>
  )
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gold-warm text-purple-royal font-bold text-2xl px-3 py-2 rounded-lg min-w-[60px] text-center shadow-lg">
        {value.toString().padStart(2, '0')}
      </div>
      <span className="text-white/60 text-xs mt-1">{label}</span>
    </div>
  )
}
