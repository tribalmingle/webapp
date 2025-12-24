'use client'

import Link from 'next/link'
import { Heart, Sparkles } from 'lucide-react'

export function SignUpCTA() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-8 shadow-xl">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold-warm/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl" />
      
      <div className="relative z-10 space-y-6">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
          <Heart className="w-7 h-7 text-white fill-white/80" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-bold text-white">
              Find Your Perfect Match
            </h3>
            <Sparkles className="w-5 h-5 text-gold-warm" />
          </div>
          <p className="text-purple-100 text-sm leading-relaxed">
            Join thousands of African singles finding meaningful connections. Start your journey to lasting love today.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/sign-up"
          className="block w-full text-center px-6 py-3.5 bg-white text-purple-700 font-semibold rounded-xl hover:bg-gold-warm hover:text-neutral-900 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          Join Now - It's Free
        </Link>

        {/* Trust Indicator */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-warm to-gold-deep border-2 border-purple-700"
              />
            ))}
          </div>
          <p className="text-xs text-purple-200">
            <span className="font-semibold text-white">12,000+</span> members joined this month
          </p>
        </div>
      </div>
    </div>
  )
}
