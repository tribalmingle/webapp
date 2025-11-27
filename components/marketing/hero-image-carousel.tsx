'use client'

import { useState, useEffect } from 'react'

export function HeroImageCarousel() {
  const images = [
    { src: '/ashanti.webp', alt: 'Ashanti tribe' },
    { src: '/hausa.webp', alt: 'Hausa tribe' },
    { src: '/igbo.webp', alt: 'Igbo tribe' },
    { src: '/yoruba.webp', alt: 'Yoruba tribe' },
  ]
  
  const [currentIndex, setCurrentIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 4000) // Change image every 4 seconds
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="relative w-full aspect-4/5">
      {images.map((image, index) => (
        <img
          key={image.src}
          src={image.src}
          alt={image.alt}
          className={`absolute inset-0 w-full h-full object-contain rounded-2xl shadow-2xl transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  )
}
