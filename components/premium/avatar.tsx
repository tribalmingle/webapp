'use client'

import { cn } from '@/lib/utils'
import { ShieldCheck, Crown, Sparkles } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-background-tertiary',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
        '3xl': 'h-24 w-24 text-3xl',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

const statusVariants = cva(
  'absolute rounded-full border-2',
  {
    variants: {
      status: {
        online: 'bg-green-500 border-background-primary',
        offline: 'bg-gray-500 border-background-primary',
        away: 'bg-yellow-500 border-background-primary',
        busy: 'bg-red-500 border-background-primary',
      },
      size: {
        xs: 'h-1.5 w-1.5 bottom-0 right-0',
        sm: 'h-2 w-2 bottom-0 right-0',
        md: 'h-2.5 w-2.5 bottom-0 right-0',
        lg: 'h-3 w-3 bottom-0.5 right-0.5',
        xl: 'h-3.5 w-3.5 bottom-0.5 right-0.5',
        '2xl': 'h-4 w-4 bottom-1 right-1',
        '3xl': 'h-5 w-5 bottom-1 right-1',
      },
    },
  }
)

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
  status?: 'online' | 'offline' | 'away' | 'busy'
  verified?: boolean
  premium?: boolean
  tribal?: boolean
  className?: string
}

export function Avatar({
  src,
  alt = 'Avatar',
  fallback,
  status,
  verified = false,
  premium = false,
  tribal = false,
  size = 'md',
  className,
}: AvatarProps) {
  const getInitials = (name?: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const initials = getInitials(fallback || alt)

  return (
    <div className={cn(avatarVariants({ size }), className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-semibold text-text-primary">{initials}</span>
      )}

      {/* Status indicator */}
      {status && (
        <span className={cn(statusVariants({ status, size }))}>
          {status === 'online' && (
            <span className="absolute inset-0 rounded-full bg-green-500 animate-glow-pulse" />
          )}
        </span>
      )}

      {/* Badge overlay */}
      {(verified || premium || tribal) && (
        <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center">
          {verified && (
            <div className="p-0.5 rounded-full bg-purple-royal shadow-glow-purple">
              <ShieldCheck className={cn(
                'text-gold-warm',
                size === 'xs' && 'h-2.5 w-2.5',
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-3.5 w-3.5',
                size === 'lg' && 'h-4 w-4',
                size === 'xl' && 'h-5 w-5',
                (size === '2xl' || size === '3xl') && 'h-6 w-6'
              )} />
            </div>
          )}
          {premium && !verified && (
            <div className="p-0.5 rounded-full bg-gold-warm shadow-glow-gold">
              <Crown className={cn(
                'text-background-primary',
                size === 'xs' && 'h-2.5 w-2.5',
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-3.5 w-3.5',
                size === 'lg' && 'h-4 w-4',
                size === 'xl' && 'h-5 w-5',
                (size === '2xl' || size === '3xl') && 'h-6 w-6'
              )} />
            </div>
          )}
          {tribal && !verified && !premium && (
            <div className="p-0.5 rounded-full bg-purple-royal/80">
              <Sparkles className={cn(
                'text-gold-warm',
                size === 'xs' && 'h-2.5 w-2.5',
                size === 'sm' && 'h-3 w-3',
                size === 'md' && 'h-3.5 w-3.5',
                size === 'lg' && 'h-4 w-4',
                size === 'xl' && 'h-5 w-5',
                (size === '2xl' || size === '3xl') && 'h-6 w-6'
              )} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface AvatarGroupProps {
  avatars: Array<{
    src?: string
    alt?: string
    fallback?: string
  }>
  max?: number
  size?: VariantProps<typeof avatarVariants>['size']
  className?: string
}

export function AvatarGroup({ avatars, max = 4, size = 'md', className }: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, max)
  const remaining = avatars.length - max

  return (
    <div className={cn('flex -space-x-2', className)}>
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className="ring-2 ring-background-primary rounded-full"
        >
          <Avatar {...avatar} size={size} />
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            avatarVariants({ size }),
            'ring-2 ring-background-primary bg-background-tertiary border-2 border-gold-warm/30'
          )}
        >
          <span className="text-xs font-semibold text-text-primary">
            +{remaining}
          </span>
        </div>
      )}
    </div>
  )
}
