"use client"

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface SwipeableCard {
  id: string
  imageUrl: string
  name: string
  age: number
  location: string
  tribe: string
  bio: string
  matchScore?: number
}

interface SwipeCardProps {
  cards: SwipeableCard[]
  onSwipeLeft?: (card: SwipeableCard) => void
  onSwipeRight?: (card: SwipeableCard) => void
  onSuperLike?: (card: SwipeableCard) => void
}

export function SwipeCardDeck({ cards, onSwipeLeft, onSwipeRight, onSuperLike }: SwipeCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchOffset, setTouchOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentCard = cards[currentIndex]
  const hasMore = currentIndex < cards.length - 1

  useEffect(() => {
    if (swipeDirection) {
      const timer = setTimeout(() => {
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1)
        }
        setSwipeDirection(null)
        setTouchOffset({ x: 0, y: 0 })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [swipeDirection, currentIndex, cards.length])

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return
    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    setTouchOffset({ x: deltaX, y: deltaY })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    const threshold = 100
    
    if (Math.abs(touchOffset.x) > threshold) {
      if (touchOffset.x > 0) {
        handleSwipeRight()
      } else {
        handleSwipeLeft()
      }
    } else if (touchOffset.y < -threshold) {
      handleSuperLike()
    } else {
      setTouchOffset({ x: 0, y: 0 })
    }
    setTouchStart(null)
  }

  const handleSwipeLeft = () => {
    setSwipeDirection('left')
    onSwipeLeft?.(currentCard)
  }

  const handleSwipeRight = () => {
    setSwipeDirection('right')
    onSwipeRight?.(currentCard)
  }

  const handleSuperLike = () => {
    setSwipeDirection('right')
    onSuperLike?.(currentCard)
  }

  if (!currentCard) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-neutral-50 rounded-2xl">
        <div className="text-center">
          <p className="text-lg font-semibold text-neutral-600">No more profiles</p>
          <p className="text-sm text-neutral-500 mt-2">Check back later for new matches</p>
        </div>
      </div>
    )
  }

  const rotation = isDragging ? touchOffset.x / 20 : 0
  const opacity = isDragging ? 1 - Math.abs(touchOffset.x) / 300 : 1

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Card Stack Preview */}
      <div className="relative h-[600px]">
        {/* Next card preview */}
        {hasMore && (
          <div className="absolute inset-0 bg-white rounded-2xl shadow-lg transform scale-95 -z-10" />
        )}
        
        {/* Current card */}
        <div
          ref={cardRef}
          className={cn(
            "absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-transform",
            swipeDirection === 'left' && 'animate-swipe-left',
            swipeDirection === 'right' && 'animate-swipe-right'
          )}
          style={{
            transform: `translateX(${touchOffset.x}px) translateY(${touchOffset.y}px) rotate(${rotation}deg)`,
            opacity,
            transition: isDragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease'
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Card Image */}
          <div className="relative h-[65%]">
            <img 
              src={currentCard.imageUrl} 
              alt={currentCard.name}
              className="w-full h-full object-cover"
            />
            
            {/* Match score badge */}
            {currentCard.matchScore && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-purple-royal text-white px-3 py-1 text-sm font-bold">
                  {currentCard.matchScore}% Match
                </Badge>
              </div>
            )}
            
            {/* Swipe indicators */}
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity",
              touchOffset.x > 50 ? "opacity-100" : "opacity-0"
            )}>
              <div className="bg-green-500 text-white px-6 py-3 rounded-full font-bold text-2xl rotate-12">
                LIKE
              </div>
            </div>
            
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity",
              touchOffset.x < -50 ? "opacity-100" : "opacity-0"
            )}>
              <div className="bg-red-500 text-white px-6 py-3 rounded-full font-bold text-2xl -rotate-12">
                NOPE
              </div>
            </div>
            
            <div className={cn(
              "absolute inset-0 flex items-center justify-center transition-opacity",
              touchOffset.y < -50 ? "opacity-100" : "opacity-0"
            )}>
              <div className="bg-blue-500 text-white px-6 py-3 rounded-full font-bold text-2xl">
                SUPER LIKE
              </div>
            </div>
          </div>
          
          {/* Card Content */}
          <div className="p-6 h-[35%] flex flex-col">
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="text-2xl font-bold text-neutral-900">{currentCard.name}</h2>
                <span className="text-xl text-neutral-600">{currentCard.age}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
                <span>{currentCard.location}</span>
                <span>•</span>
                <span>{currentCard.tribe}</span>
              </div>
              
              <p className="text-sm text-neutral-700 line-clamp-2">{currentCard.bio}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-center items-center gap-6 mt-6">
        <Button
          variant="outline"
          size="icon"
          className="w-14 h-14 rounded-full border-2 hover:border-red-500 hover:text-red-500 transition-colors"
          onClick={handleSwipeLeft}
        >
          <X className="w-6 h-6" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="w-16 h-16 rounded-full border-2 hover:border-blue-500 hover:text-blue-500 transition-colors"
          onClick={handleSuperLike}
        >
          <Star className="w-7 h-7" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="w-14 h-14 rounded-full border-2 hover:border-green-500 hover:text-green-500 transition-colors"
          onClick={handleSwipeRight}
        >
          <Heart className="w-6 h-6" />
        </Button>
      </div>
      
      {/* Cards remaining indicator */}
      <div className="text-center mt-4">
        <p className="text-sm text-neutral-500">
          {cards.length - currentIndex - 1} profiles remaining
        </p>
      </div>
    </div>
  )
}
