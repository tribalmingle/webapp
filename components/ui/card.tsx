import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const cardVariants = cva(
  'overflow-hidden transition-all duration-300',
  {
    variants: {
      variant: {
        // DEFAULT: Elevated with subtle glow
        default:
          'bg-bg-secondary border border-border-gold/30 rounded-xl shadow-premium hover:shadow-premium-lg hover:border-border-gold/50',
        
        // PREMIUM: Strong gold border with glow
        premium:
          'bg-bg-secondary border-2 border-gold-warm/40 rounded-xl shadow-glow-gold backdrop-blur-sm',
        
        // GLASS: Glassmorphism effect
        glass:
          'bg-bg-secondary/60 border border-border-gold/20 rounded-xl backdrop-blur-xl shadow-premium',
        
        // FLAT: Minimal for dense layouts
        flat:
          'bg-bg-secondary border border-border-gold/10 rounded-lg',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        comfortable: 'p-5',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
    },
  }
)

function Card({ 
  className, 
  variant,
  padding,
  ...props 
}: React.ComponentProps<'div'> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold text-text-primary', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-text-secondary text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn('px-6', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    />
  )
}

export {
  Card,
  cardVariants,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
