import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const textareaVariants = cva(
  'flex min-h-[120px] w-full rounded-lg border-2 px-4 py-3 text-base transition-all duration-200 placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-gold-warm focus:ring-offset-2 focus:ring-offset-background-primary disabled:cursor-not-allowed disabled:opacity-50 resize-y',
  {
    variants: {
      variant: {
        default: 'bg-background-tertiary border-background-tertiary text-text-primary hover:border-purple-royal/20 focus:border-gold-warm',
        premium: 'bg-background-secondary border-purple-royal/30 text-text-primary hover:border-purple-royal/40 focus:border-gold-warm shadow-premium focus:shadow-glow-gold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }

