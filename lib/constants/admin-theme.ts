/**
 * Admin Dashboard Theme Constants
 * 
 * Centralized color system for admin interface to ensure brand consistency
 * and avoid generic Tailwind colors like bg-green-500, bg-red-500, etc.
 * 
 * All colors use the TribalMingle brand palette:
 * - Purple Royal (#5B2E91) for primary brand elements
 * - Gold Warm (#D4AF37) for success/active states
 * - Destructive (#DC2626) for errors/critical
 */

export const ADMIN_COLORS = {
  status: {
    active: 'bg-gold-warm/20 text-gold-warm border border-gold-warm/40',
    pending: 'bg-purple-royal/20 text-purple-royal-light border border-purple-royal/40',
    suspended: 'bg-destructive/20 text-destructive border border-destructive/40',
    inactive: 'bg-text-tertiary/20 text-text-tertiary border border-text-tertiary/40',
    verified: 'bg-gold-warm/20 text-gold-warm border border-gold-warm/40',
    unverified: 'bg-text-tertiary/20 text-text-tertiary border border-text-tertiary/40',
    healthy: 'bg-gold-warm/20 text-gold-warm',
    degraded: 'bg-purple-royal/20 text-purple-royal-light',
    down: 'bg-destructive/20 text-destructive',
    operational: 'bg-gold-warm/20 text-gold-warm border border-gold-warm/40',
    maintenance: 'bg-purple-royal/20 text-purple-royal-light border border-purple-royal/40',
    outage: 'bg-destructive/20 text-destructive border border-destructive/40',
  },
  priority: {
    urgent: 'bg-destructive text-white',
    high: 'bg-purple-royal text-white',
    medium: 'bg-purple-royal-light text-white',
    low: 'bg-text-tertiary text-white',
  },
  badge: {
    success: 'bg-gold-warm/20 text-gold-warm border border-gold-warm/40',
    warning: 'bg-purple-royal/20 text-purple-royal-light border border-purple-royal/40',
    error: 'bg-destructive/20 text-destructive border border-destructive/40',
    info: 'bg-purple-royal/20 text-purple-royal border border-purple-royal/40',
    neutral: 'bg-text-tertiary/20 text-text-secondary border border-text-tertiary/40',
  },
  card: {
    primary: 'bg-background-secondary border border-border-gold/20',
    secondary: 'bg-background-tertiary border border-border-gold/10',
    elevated: 'bg-background-secondary border border-border-gold/30 shadow-premium',
    glass: 'bg-background-secondary/60 backdrop-blur-xl border border-border-gold/20',
  },
} as const

export type AdminStatusType = keyof typeof ADMIN_COLORS.status
export type AdminPriorityType = keyof typeof ADMIN_COLORS.priority
export type AdminBadgeType = keyof typeof ADMIN_COLORS.badge
export type AdminCardType = keyof typeof ADMIN_COLORS.card
