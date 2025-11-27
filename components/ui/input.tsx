import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const inputVariants = cva(
  'w-full transition-all duration-200 font-medium placeholder:text-text-tertiary disabled:opacity-50 disabled:cursor-not-allowed file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary outline-none',
  {
    variants: {
      variant: {
        default:
          'bg-bg-tertiary border-2 border-border-gold/30 text-text-primary rounded px-4 py-3 focus:border-gold-warm focus:ring-4 focus:ring-gold-warm/20',
        
        premium:
          'bg-bg-secondary border-2 border-gold-warm/40 text-text-primary rounded px-4 py-3 shadow-glow-gold/30 focus:border-gold-warm focus:shadow-glow-gold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Input({ 
  className, 
  type, 
  variant,
  ...props 
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
