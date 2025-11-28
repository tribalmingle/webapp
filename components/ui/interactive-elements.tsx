'use client'

import React, { useRef, useState, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate, animate } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- CountUp Stats ---
export function CountUpStats({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, { damping: 30, stiffness: 100 })
  const rounded = useTransform(springValue, (latest) => Math.round(latest))

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 2.5, ease: "easeOut" })
    return controls.stop
  }, [value, motionValue])

  useEffect(() => {
    return rounded.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest.toLocaleString() + suffix
      }
    })
  }, [rounded, suffix])

  return (
    <div className="flex flex-col">
      <span ref={ref} className="text-3xl font-bold text-text-primary tabular-nums">
        0{suffix}
      </span>
      <span className="text-sm text-text-tertiary">{label}</span>
    </div>
  )
}

// --- Mouse Parallax Background ---
export function MouseParallax({ children, strength = 0.05 }: { children: React.ReactNode; strength?: number }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  // Smooth out the mouse movement
  const springConfig = { damping: 25, stiffness: 150 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const { clientX, clientY, currentTarget } = event
    const { width, height, left, top } = currentTarget.getBoundingClientRect()
    
    // Calculate position relative to center (-0.5 to 0.5)
    const relativeX = (clientX - left) / width - 0.5
    const relativeY = (clientY - top) / height - 0.5
    
    x.set(relativeX * width * strength)
    y.set(relativeY * height * strength)
  }

  return (
    <motion.div 
      onMouseMove={handleMouseMove}
      className="absolute inset-0 overflow-hidden"
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  )
}

// --- Magnetic Button ---
export function MagneticButton({ children, className, ...props }: React.ComponentProps<typeof motion.button>) {
  const ref = useRef<HTMLButtonElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    const { clientX, clientY } = event
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    
    x.set((clientX - centerX) * 0.3)
    y.set((clientY - centerY) * 0.3)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={cn("relative", className)}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// --- Magnetic Wrapper ---
export function MagneticWrapper({ children, className, strength = 0.3 }: { children: React.ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const { clientX, clientY } = event
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect()
    const centerX = left + width / 2
    const centerY = top + height / 2
    
    x.set((clientX - centerX) * strength)
    y.set((clientY - centerY) * strength)
  }

  function handleMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className={cn("inline-block", className)}
    >
      {children}
    </motion.div>
  )
}

// --- Glow Card ---
export function GlowCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect()
    mouseX.set(clientX - left)
    mouseY.set(clientY - top)
  }

  return (
    <div
      className={cn("group relative border overflow-hidden rounded-xl", className)}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 215, 0, 0.15),
              transparent 80%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  )
}

// --- Infinite Marquee ---
export function Marquee({ children, className, duration = 50, pauseOnHover = false }: { children: React.ReactNode; className?: string; duration?: number; pauseOnHover?: boolean }) {
  return (
    <div className={cn("flex overflow-hidden group", className)}>
      <motion.div
        className="flex shrink-0 gap-6 pr-6"
        animate={{ x: "-100%" }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        style={{ animationPlayState: pauseOnHover ? "paused" : "running" }}
      >
        {children}
      </motion.div>
      <motion.div
        className="flex shrink-0 gap-6 pr-6"
        animate={{ x: "-100%" }}
        transition={{ duration, repeat: Infinity, ease: "linear" }}
        style={{ animationPlayState: pauseOnHover ? "paused" : "running" }}
      >
        {children}
      </motion.div>
    </div>
  )
}
