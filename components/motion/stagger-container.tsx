'use client'

import * as React from 'react'
import { motion, type Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
}

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1], // smooth easing
    },
  },
}

interface StaggerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  staggerDelay?: number
  itemClassName?: string
}

/**
 * StaggerContainer - Animates children with staggered fade-in from bottom
 * 
 * @example
 * <StaggerContainer>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </StaggerContainer>
 */
export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  itemClassName,
  ...props
}: StaggerContainerProps) {
  const customContainerVariants = {
    ...containerVariants,
    visible: {
      ...containerVariants.visible,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.05,
      },
    },
  }

  return (
    <motion.div
      variants={customContainerVariants}
      initial="hidden"
      animate="visible"
      className={cn(className)}
      {...(props as any)}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants} className={cn(itemClassName)}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

/**
 * Grid variant with faster stagger for dense layouts
 */
export function StaggerGrid({
  children,
  className,
  columns = 3,
  ...props
}: StaggerContainerProps & { columns?: number }) {
  return (
    <StaggerContainer
      className={cn(
        'grid gap-6',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
        className
      )}
      staggerDelay={0.05}
      {...props}
    >
      {children}
    </StaggerContainer>
  )
}

// Export variants for manual use
export { containerVariants, itemVariants }
