import { cn } from '@/lib/utils'

// Notification Badge (for counts)
interface NotificationBadgeProps {
  count: number
  max?: number
  variant?: 'default' | 'gold' | 'error'
  className?: string
}

export function NotificationBadge({
  count,
  max = 99,
  variant = 'error',
  className,
}: NotificationBadgeProps) {
  const displayCount = count > max ? `${max}+` : count.toString()

  if (count === 0) return null

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full',
        variant === 'error' && 'bg-red-500 text-white',
        variant === 'gold' && 'bg-gold-warm text-background-primary shadow-glow-gold',
        variant === 'default' && 'bg-purple-royal text-white',
        className
      )}
    >
      {displayCount}
    </span>
  )
}

// Status Badge
interface StatusBadgeProps {
  status: 'online' | 'offline' | 'away' | 'busy' | 'pending' | 'active' | 'inactive'
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  const statusConfig = {
    online: { label: 'Online', color: 'bg-green-500/10 text-green-400 border-green-500/30', dot: 'bg-green-400' },
    offline: { label: 'Offline', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30', dot: 'bg-gray-400' },
    away: { label: 'Away', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-400' },
    busy: { label: 'Busy', color: 'bg-red-500/10 text-red-400 border-red-500/30', dot: 'bg-red-400' },
    pending: { label: 'Pending', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', dot: 'bg-orange-400' },
    active: { label: 'Active', color: 'bg-green-500/10 text-green-400 border-green-500/30', dot: 'bg-green-400' },
    inactive: { label: 'Inactive', color: 'bg-gray-500/10 text-gray-400 border-gray-500/30', dot: 'bg-gray-400' },
  }

  const config = statusConfig[status]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border',
        config.color,
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)}>
          {status === 'online' && (
            <span className="absolute inset-0 rounded-full animate-glow-pulse" />
          )}
        </span>
      )}
      <span>{config.label}</span>
    </div>
  )
}

// Match Score Badge
interface MatchScoreBadgeProps {
  score: number
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export function MatchScoreBadge({ score, size = 'default', className }: MatchScoreBadgeProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'from-green-500 to-emerald-600'
    if (score >= 75) return 'from-blue-500 to-cyan-600'
    if (score >= 60) return 'from-yellow-500 to-orange-600'
    return 'from-orange-500 to-red-600'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold shadow-lg',
        `bg-linear-to-r ${getScoreColor(score)}`,
        size === 'sm' && 'text-xs px-2 py-1',
        size === 'lg' && 'text-base px-4 py-2',
        className
      )}
    >
      <span className="text-white">{score}%</span>
      <span className="text-white/80 text-xs font-normal">Match</span>
    </div>
  )
}
