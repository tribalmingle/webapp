import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-4 focus-visible:ring-gold-warm/20 relative overflow-hidden group",
  {
    variants: {
      variant: {
        // PRIMARY: Purple Royal gradient with gold glow on hover
        default:
          'bg-purple-gradient text-text-primary shadow-lg hover:scale-105 active:scale-95',
        primary:
          'bg-purple-gradient text-text-primary shadow-lg hover:scale-105 active:scale-95',
        
        // GOLD: Main CTA - gold gradient with strong glow + shimmer
        gold:
          'bg-gold-gradient text-bg-primary shadow-glow-gold hover:scale-105 active:scale-95',
        
        // DESTRUCTIVE: Red for dangerous actions
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:scale-105 active:scale-95',
        
        // OUTLINE: Subtle with gold border
        outline:
          'border-2 border-border-gold bg-transparent text-text-primary hover:border-border-gold-hover hover:bg-gold-warm/10',
        
        // SECONDARY: Muted purple
        secondary:
          'bg-purple-royal/20 text-text-primary border border-purple-royal/40 hover:bg-purple-royal/30',
        
        // GHOST: Minimal hover state
        ghost:
          'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
        
        // LINK: Text-only with underline
        link:
          'text-gold-warm underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6 text-base',
        sm: 'h-9 px-4 text-sm has-[>svg]:px-3',
        lg: 'h-14 px-8 text-lg has-[>svg]:px-6',
        xl: 'h-16 px-10 text-xl has-[>svg]:px-8',
        icon: 'size-11',
        'icon-sm': 'size-9',
        'icon-lg': 'size-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      aria-disabled={props.disabled}
      {...props}
    >
      {/* Shimmer effect overlay on hover (gold & default variants) */}
      {(variant === 'gold' || variant === 'default' || !variant) && (
        <span className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      )}
      
      {/* Content wrapper for icon animations */}
      <span className="relative z-10 flex items-center justify-center gap-2 [&>svg]:transition-transform [&>svg]:duration-300 group-hover:[&>svg]:rotate-12 group-hover:[&>svg]:scale-110">
        {children}
      </span>
    </Comp>
  )
}

export { Button, buttonVariants }
