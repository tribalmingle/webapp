"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Compass,
  Heart,
  LayoutDashboard,
  MessageSquare,
  Settings,
  ShieldCheck,
  Sparkles,
  Search,
  Crown,
  User,
  Eye,
  Home,
  X,
} from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { useDesignSystem } from "@/components/providers/design-system-provider"
import { MemberQuickActions } from "@/components/member/member-quick-actions"
import { NotificationsMenu } from "@/components/member/notifications-menu"
import { MobileBottomNav } from "@/components/layouts/mobile-bottom-nav"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAnalytics } from "@/lib/hooks/use-analytics"
import { 
  AFRICAN_COUNTRIES_WITH_TRIBES, 
  getTribesForCountry,
  COUNTRIES,
  CITIES_BY_COUNTRY,
  getCitiesForCountry,
  HEIGHTS_IN_FEET,
  EDUCATION_LEVELS,
  RELIGIONS,
  MARITAL_STATUS_OPTIONS,
  BODY_TYPES
} from "@/lib/constants/profile-options"

interface MemberAppShellProps {
  children: ReactNode
  title?: string
  description?: string
  actions?: ReactNode
  contextualNav?: ReactNode
}

interface NavItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard-spa", icon: LayoutDashboard },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Chat", href: "/chat", icon: MessageSquare, badge: "3" },
  { label: "Likes", href: "/likes", icon: Heart },
  { label: "Safety", href: "/safety", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings },
]

export default function MemberAppShellClient({ children, title, description, actions, contextualNav }: MemberAppShellProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { tokens } = useDesignSystem()
  const { track } = useAnalytics()
  const attributionMemo = useRef<string | null>(null)
  
  // Search modal state
  const [showSearch, setShowSearch] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [basicMinAge, setBasicMinAge] = useState<number | ''>(30)
  const [basicMaxAge, setBasicMaxAge] = useState<number | ''>(45)
  const [basicTribe, setBasicTribe] = useState<string>('i-dont-mind')
  
  // Advanced search filters
  const [advMinAge, setAdvMinAge] = useState<number | ''>(30)
  const [advMaxAge, setAdvMaxAge] = useState<number | ''>(45)
  const [advTribe, setAdvTribe] = useState<string>('i-dont-mind')
  const [advCountry, setAdvCountry] = useState<string>('')
  const [advCity, setAdvCity] = useState<string>('')
  const [advMinHeight, setAdvMinHeight] = useState<string>('')
  const [advMaxHeight, setAdvMaxHeight] = useState<string>('')
  const [advEducation, setAdvEducation] = useState<string>('')
  const [advReligion, setAdvReligion] = useState<string>('')
  const [advMaritalStatus, setAdvMaritalStatus] = useState<string>('')
  const [advBodyType, setAdvBodyType] = useState<string>('')

  const initials = (user?.name || user?.email || "TM")
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase()

  useEffect(() => {
    if (!searchParams) {
      return
    }

    const attribution: Record<string, string> = {}
    const supportedKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "invite", "code"]
    supportedKeys.forEach((key) => {
      const value = searchParams.get(key)
      if (value) {
        attribution[key] = value
      }
    })

    if (Object.keys(attribution).length === 0) {
      return
    }

    const memo = JSON.stringify(attribution)
    if (attributionMemo.current === memo) {
      return
    }

    attributionMemo.current = memo

    if (typeof window !== "undefined") {
      sessionStorage.setItem("tm_member_attribution", memo)
    }

    track("deep_link_opened", {
      ...attribution,
      landingPage: pathname,
    })
  }, [searchParams, track, pathname])

  return (
    <div className="relative flex min-h-screen text-foreground">
      {/* Premium background effects */}
      <div className="fixed inset-0 -z-50 bg-hero-gradient">
        <div className="absolute top-20 left-20 w-48 h-48 md:w-96 md:h-96 bg-purple-royal/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold-warm/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-royal/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Grid overlay */}
      <div className="fixed inset-0 -z-40 bg-[url('/grid.svg')] opacity-10" />
      
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-border bg-card/60 backdrop-blur-sm sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 lg:px-6 pb-4 lg:pb-6 pt-6 lg:pt-8">
          <Link href="/dashboard-spa" className="flex items-center gap-2">
            <img src="/triballogo.png" alt="Tribal Mingle" className="h-10 lg:h-12 w-auto" />
          </Link>
          <p className="mt-1 text-xs lg:text-sm text-muted-foreground">Your daily member workspace</p>
        </div>

        <div className="px-3 lg:px-4">
          <div className="rounded-xl lg:rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-3 lg:p-4">
            <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
            <p className="mt-1 text-sm font-semibold truncate">{user?.name || user?.email || "Member"}</p>
            {user?.location && <p className="text-xs text-muted-foreground truncate">{user.location}</p>}
            <Badge variant="secondary" className="mt-2 lg:mt-3 text-xs">
              {user?.subscriptionPlan ? user.subscriptionPlan : "Trial"}
            </Badge>
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-1 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = pathname?.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-primary/20 px-2 text-xs font-semibold text-primary">
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
          
          {/* Subscription Link */}
          <Link
            href="/subscription"
            className={cn(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              pathname?.startsWith("/subscription")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <Crown className="h-5 w-5" />
            <span className="flex-1">
              {!user?.subscriptionPlan || user.subscriptionPlan === 'free' ? 'Upgrade' : 'Subscription'}
            </span>
          </Link>
          
          {/* Profile Link */}
          <Link
            href="/profile"
            className={cn(
              "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              pathname?.startsWith("/profile")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <User className="h-5 w-5" />
            <span className="flex-1">Profile</span>
          </Link>
        </nav>

        <div className="px-4 pb-6">
          <div
            className="rounded-2xl p-4 text-primary-foreground"
            style={{
              backgroundImage: `linear-gradient(130deg, ${tokens.colors.primary} 0%, ${tokens.colors.accent} 100%)`,
              boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider">Boost visibility</p>
            <p className="mt-1.5 text-sm font-medium">Turn on concierge boost to stay on top of your tribe.</p>
            <Link href="/premium" className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="h-3.5 w-3.5" /> Upgrade now
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header
          className="sticky top-0 z-30 border-b border-border/50 bg-background/60 backdrop-blur-md"
          style={{ boxShadow: `0 1px 0 ${tokens.colors.border}` }}
        >
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-10">
            {/* Logo */}
            <Link href="/dashboard-spa" className="flex items-center">
              <img src="/triballogo.png" alt="Tribal Mingle" className="h-8 w-auto" />
            </Link>
            
            {/* Right side icons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setShowSearch(prev => !prev)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              <NotificationsMenu />
              <Link href="/profile" className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user?.profilePhoto ?? undefined} alt={user?.name ?? "Member"} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </div>
          
          {/* Search Dropdown */}
          {showSearch && (
            <div className="border-t border-border bg-card/95 backdrop-blur-xl animate-in slide-in-from-top-2 duration-200">
              <div className="mx-auto w-full max-w-6xl px-4 py-4 lg:px-10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Quick Search</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Find your perfect match</p>
                  </div>
                  <button
                    onClick={() => setShowSearch(false)}
                    className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search Summary */}
                <div className="bg-muted/30 rounded-lg p-3 mb-3">
                  <p className="text-sm text-foreground">
                    Looking for a{' '}
                    <span className="font-semibold text-purple-royal">
                      {basicMinAge || 30}-{basicMaxAge || 45}
                    </span>
                    {' '}year old from{' '}
                    <span className="font-semibold text-purple-royal">
                      {basicTribe !== 'i-dont-mind' ? `${basicTribe} tribe` : 'any tribe'}
                    </span>
                  </p>
                </div>

                {/* Search Controls - All in one line */}
                <div className="flex items-center gap-2">
                  {/* Age Range */}
                  <Input
                    type="number"
                    min={30}
                    max={79}
                    value={basicMinAge}
                    onChange={(e) => {
                      const v = e.target.value ? parseInt(e.target.value, 10) : ''
                      setBasicMinAge(v === '' ? '' : Math.min(Math.max(v, 30), 79))
                    }}
                    className="w-20 text-sm"
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    min={30}
                    max={79}
                    value={basicMaxAge}
                    onChange={(e) => {
                      const v = e.target.value ? parseInt(e.target.value, 10) : ''
                      setBasicMaxAge(v === '' ? '' : Math.min(Math.max(v, 30), 79))
                    }}
                    className="w-20 text-sm"
                    placeholder="Max"
                  />

                  {/* Tribe */}
                  <select
                    value={basicTribe}
                    onChange={(e) => setBasicTribe(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-royal"
                  >
                    <option value="i-dont-mind">Any tribe</option>
                    {(user?.countryOfOrigin
                      ? getTribesForCountry(user.countryOfOrigin).map((tribe) => ({ tribe, country: user.countryOfOrigin }))
                      : Object.keys(AFRICAN_COUNTRIES_WITH_TRIBES).flatMap((country) =>
                          AFRICAN_COUNTRIES_WITH_TRIBES[country].map((tribe) => ({ tribe, country }))
                        )
                    ).map(({ tribe, country }) => (
                      <option key={`${country}-${tribe}`} value={tribe}>{tribe}</option>
                    ))}
                  </select>

                  {/* Buttons */}
                  <Button
                    onClick={() => {
                      window.location.href = `/discover?minAge=${basicMinAge || 30}&maxAge=${basicMaxAge || 45}&tribe=${basicTribe}`
                      setShowSearch(false)
                    }}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSearch(false)
                      setShowAdvancedSearch(true)
                    }}
                  >
                    Advanced
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {contextualNav ? (
            <div className="border-t border-border bg-background/60">
              <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-10">{contextualNav}</div>
            </div>
          ) : null}
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 pb-20 lg:pb-12 pt-4 sm:pt-6 lg:px-10">
            <div className="mb-4 sm:mb-6">
              <MemberQuickActions />
            </div>
            {children}
          </div>
        </main>
      </div>

      <MobileBottomNav chatBadgeCount={3} />
      
      {/* Advanced Search Modal */}
      {showAdvancedSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center py-8 px-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAdvancedSearch(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-4xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden" style={{ borderRadius: '15px', maxHeight: 'calc(100vh - 4rem)' }}>
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 4rem)' }}>
              <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b border-border p-4 md:p-6 z-10">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground">Advanced Search</h2>
                    <p className="text-sm text-muted-foreground mt-1">Find your perfect match with detailed filters</p>
                  </div>
                  <button
                    onClick={() => setShowAdvancedSearch(false)}
                    className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-4 md:p-6 space-y-6">
                {/* Age Range */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Age Range</label>
                  <div className="flex gap-3">
                    <Input
                      type="number"
                      min={30}
                      max={79}
                      value={advMinAge}
                      onChange={(e) => {
                        const v = e.target.value ? parseInt(e.target.value, 10) : ''
                        setAdvMinAge(v === '' ? '' : Math.min(Math.max(v, 30), 79))
                      }}
                      placeholder="Min Age"
                    />
                    <Input
                      type="number"
                      min={30}
                      max={79}
                      value={advMaxAge}
                      onChange={(e) => {
                        const v = e.target.value ? parseInt(e.target.value, 10) : ''
                        setAdvMaxAge(v === '' ? '' : Math.min(Math.max(v, 30), 79))
                      }}
                      placeholder="Max Age"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Country</label>
                    <select
                      value={advCountry}
                      onChange={(e) => {
                        setAdvCountry(e.target.value)
                        setAdvCity('')
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-royal"
                    >
                      <option value="">Any Country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">City</label>
                    <select
                      value={advCity}
                      onChange={(e) => setAdvCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-royal"
                      disabled={!advCountry}
                    >
                      <option value="">Any City</option>
                      {advCountry && CITIES_BY_COUNTRY[advCountry]?.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tribe */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tribe</label>
                  <select
                    value={advTribe}
                    onChange={(e) => setAdvTribe(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-royal"
                  >
                    <option value="i-dont-mind">Any tribe</option>
                    {Object.keys(AFRICAN_COUNTRIES_WITH_TRIBES).flatMap((country) =>
                      AFRICAN_COUNTRIES_WITH_TRIBES[country].map((tribe) => (
                        <option key={`${country}-${tribe}`} value={tribe}>{tribe}</option>
                      ))
                    )}
                  </select>
                </div>

                {/* Height Range */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Height Range</label>
                  <div className="flex gap-3">
                    <select
                      value={advMinHeight}
                      onChange={(e) => setAdvMinHeight(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-royal"
                    >
                      <option value="">Min Height</option>
                      {HEIGHTS_IN_FEET.map((height) => (
                        <option key={height} value={height}>{height}</option>
                      ))}
                    </select>
                    <select
                      value={advMaxHeight}
                      onChange={(e) => setAdvMaxHeight(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-royal"
                    >
                      <option value="">Max Height</option>
                      {HEIGHTS_IN_FEET.map((height) => (
                        <option key={height} value={height}>{height}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Education Level</label>
                    <select
                      value={advEducation}
                      onChange={(e) => setAdvEducation(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-royal"
                    >
                      <option value="">Any Education</option>
                      {EDUCATION_LEVELS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Religion</label>
                    <select
                      value={advReligion}
                      onChange={(e) => setAdvReligion(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-royal"
                    >
                      <option value="">Any Religion</option>
                      {RELIGIONS.map((religion) => (
                        <option key={religion} value={religion}>{religion}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Marital Status & Body Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Marital Status</label>
                    <select
                      value={advMaritalStatus}
                      onChange={(e) => setAdvMaritalStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-royal"
                    >
                      <option value="">Any Status</option>
                      {MARITAL_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Body Type</label>
                    <select
                      value={advBodyType}
                      onChange={(e) => setAdvBodyType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-purple-royal"
                    >
                      <option value="">Any Body Type</option>
                      {BODY_TYPES.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      // Reset all filters
                      setAdvMinAge(30)
                      setAdvMaxAge(45)
                      setAdvTribe('i-dont-mind')
                      setAdvCountry('')
                      setAdvCity('')
                      setAdvMinHeight('')
                      setAdvMaxHeight('')
                      setAdvEducation('')
                      setAdvReligion('')
                      setAdvMaritalStatus('')
                      setAdvBodyType('')
                    }}
                  >
                    Reset Filters
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      // Build query params
                      const params = new URLSearchParams()
                      if (advMinAge) params.append('minAge', String(advMinAge))
                      if (advMaxAge) params.append('maxAge', String(advMaxAge))
                      if (advTribe !== 'i-dont-mind') params.append('tribe', advTribe)
                      if (advCountry) params.append('country', advCountry)
                      if (advCity) params.append('city', advCity)
                      if (advMinHeight) params.append('minHeight', advMinHeight)
                      if (advMaxHeight) params.append('maxHeight', advMaxHeight)
                      if (advEducation) params.append('education', advEducation)
                      if (advReligion) params.append('religion', advReligion)
                      if (advMaritalStatus) params.append('maritalStatus', advMaritalStatus)
                      if (advBodyType) params.append('bodyType', advBodyType)
                      
                      window.location.href = `/discover?${params.toString()}`
                      setShowAdvancedSearch(false)
                    }}
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
