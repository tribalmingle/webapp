'use client'

import { useState, useEffect } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

const TESTIMONIALS = [
  {
    name: "Ada",
    location: "Lagos, Nigeria",
    tribe: "Igbo",
    content: "I never thought I'd find someone who understands the nuances of an Igbo traditional wedding while living in the city. Tribal Mingle made it happen.",
    rating: 5
  },
  {
    name: "Kwame",
    location: "Accra, Ghana",
    tribe: "Ashanti",
    content: "Quality over quantity. Every match felt curated. I met my fiancée within a month of joining.",
    rating: 5
  },
  {
    name: "Lola",
    location: "London, UK",
    tribe: "Yoruba",
    content: "Living in London, I missed the deep connection of home. Here, I found a partner who speaks my language and loves my food.",
    rating: 5
  },
  {
    name: "Chidi",
    location: "Houston, USA",
    tribe: "Igbo",
    content: "The verification process gave me peace of mind. It's refreshing to see a platform full of serious people looking for marriage.",
    rating: 5
  },
  {
    name: "Zainab",
    location: "Abuja, Nigeria",
    tribe: "Hausa",
    content: "Finally, a platform that respects my values and privacy. The community feels safe and exclusive.",
    rating: 5
  },
  {
    name: "Amara",
    location: "Nairobi, Kenya",
    tribe: "Kikuyu",
    content: "The cultural connection is real. I found someone who values family traditions as much as I do.",
    rating: 5
  }
]

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    // Resume auto-play after 10 seconds of manual navigation
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const currentTestimonial = TESTIMONIALS[currentIndex]

  return (
    <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-2xl p-6 shadow-xl border border-neutral-700">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">Success Stories</h3>
        <p className="text-sm text-neutral-400">Real couples, real connections</p>
      </div>

      {/* Testimonial Content */}
      <div className="mb-6">
        {/* 5-Star Rating */}
        <div className="flex gap-1 mb-4">
          {[...Array(currentTestimonial.rating)].map((_, i) => (
            <Star key={i} className="w-5 h-5 text-gold-warm fill-gold-warm" />
          ))}
        </div>

        {/* Quote */}
        <blockquote className="text-neutral-200 text-sm leading-relaxed mb-6 italic">
          "{currentTestimonial.content}"
        </blockquote>

        {/* Author Info */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {currentTestimonial.name.charAt(0)}
          </div>

          {/* Name, Location, Tribe */}
          <div>
            <p className="font-semibold text-white">{currentTestimonial.name}</p>
            <p className="text-xs text-neutral-400">{currentTestimonial.location}</p>
            <p className="text-xs text-purple-400">{currentTestimonial.tribe}</p>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between">
        {/* Navigation Arrows */}
        <div className="flex gap-2">
          <button
            onClick={goToPrevious}
            className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="w-8 h-8 rounded-full bg-neutral-700 hover:bg-neutral-600 flex items-center justify-center transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Dots Navigation */}
        <div className="flex gap-1.5">
          {TESTIMONIALS.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-gold-warm w-6'
                  : 'bg-neutral-600 hover:bg-neutral-500'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
