import * as React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold transition-all duration-200 w-fit whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'bg-background-tertiary text-text-primary border border-purple-royal/20',
        primary: 'bg-purple-royal/20 text-purple-royal border border-purple-royal/40',
        secondary: 'bg-background-secondary text-text-secondary border border-border-gold/20',
        gold: 'bg-gold-warm/20 text-gold-warm border border-gold-warm/40 shadow-glow-gold',
        success: 'bg-green-500/10 text-green-400 border border-green-500/30',
        warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
        error: 'bg-red-500/10 text-red-400 border border-red-500/30',
        destructive: 'bg-red-500/10 text-red-400 border border-red-500/30',
        info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
        verified: 'bg-linear-to-r from-purple-royal/20 to-gold-warm/20 text-text-primary border border-gold-warm/30',
        premium: 'bg-gold-gradient text-background-primary shadow-glow-gold border-0',
        outline: 'bg-transparent text-text-primary border border-purple-royal/30 hover:bg-purple-royal/10',
        purple: 'bg-purple-royal/20 text-purple-royal border border-purple-royal/40',
      },
      size: {
        sm: 'text-[10px] px-2 py-0.5 rounded-md',
        default: 'text-xs px-2.5 py-1 rounded-md',
        lg: 'text-sm px-3 py-1.5 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  onRemove?: () => void
  icon?: React.ReactNode
  dot?: boolean
}

function Badge({
  className,
  variant,
  size,
  onRemove,
  icon,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-green-400',
            variant === 'warning' && 'bg-yellow-400',
            variant === 'error' && 'bg-red-400',
            variant === 'destructive' && 'bg-red-400',
            variant === 'info' && 'bg-blue-400',
            variant === 'primary' && 'bg-purple-royal',
            variant === 'gold' && 'bg-gold-warm',
            variant === 'default' && 'bg-text-secondary'
          )}
        />
      )}
      {icon && <span className="inline-flex">{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="inline-flex items-center justify-center hover:opacity-70 transition-opacity"
          aria-label="Remove badge"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

export { Badge, badgeVariants }
