'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number
  suffix?: string
  prefix?: string
  trend?: number
  trendLabel?: string
  icon?: React.ReactNode
  variant?: 'default' | 'premium' | 'glass'
  animated?: boolean
  decimals?: number
}

export function StatCard({
  title,
  value,
  suffix = '',
  prefix = '',
  trend,
  trendLabel = 'vs last month',
  icon,
  variant = 'default',
  animated = true,
  decimals = 0,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value)

  useEffect(() => {
    if (!animated) return

    const duration = 1500 // 1.5 seconds
    const steps = 60
    const stepValue = value / steps
    const stepDuration = duration / steps

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      if (currentStep >= steps) {
        setDisplayValue(value)
        clearInterval(interval)
      } else {
        setDisplayValue(Math.floor(stepValue * currentStep))
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [value, animated])

  const formattedValue = decimals > 0 
    ? displayValue.toFixed(decimals)
    : displayValue.toLocaleString()

  const isPositiveTrend = trend !== undefined && trend > 0
  const isNegativeTrend = trend !== undefined && trend < 0

  return (
    <Card variant={variant} padding="comfortable" className="relative overflow-hidden group">
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-linear-to-br from-purple-royal/5 to-gold-warm/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="relative space-y-4">
        {/* Header with icon */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-text-secondary uppercase tracking-wider">
              {title}
            </p>
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-purple-royal/10 text-purple-royal group-hover:bg-purple-royal/20 transition-colors">
              {icon}
            </div>
          )}
        </div>

        {/* Main value */}
        <div className="space-y-1">
          <div className="text-display-md font-display text-text-primary">
            {prefix}
            {formattedValue}
            {suffix}
          </div>

          {/* Trend indicator */}
          {trend !== undefined && (
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold',
                  isPositiveTrend && 'bg-green-500/10 text-green-400',
                  isNegativeTrend && 'bg-red-500/10 text-red-400'
                )}
              >
                {isPositiveTrend ? (
                  <ArrowUp className="w-3 h-3" />
                ) : isNegativeTrend ? (
                  <ArrowDown className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                <span>{Math.abs(trend)}%</span>
              </div>
              <span className="text-xs text-text-tertiary">{trendLabel}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface MiniStatProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  variant?: 'default' | 'gold' | 'purple'
}

export function MiniStat({ label, value, icon, variant = 'default' }: MiniStatProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg bg-background-tertiary border border-purple-royal/10 hover:border-purple-royal/30 transition-colors">
      {icon && (
        <div
          className={cn(
            'p-2 rounded-md',
            variant === 'gold' && 'bg-gold-warm/10 text-gold-warm',
            variant === 'purple' && 'bg-purple-royal/10 text-purple-royal',
            variant === 'default' && 'bg-background-secondary text-text-secondary'
          )}
        >
          {icon}
        </div>
      )}
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-text-primary">{value}</p>
      </div>
    </div>
  )
}
