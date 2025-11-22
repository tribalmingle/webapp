"use client"

import type { ReactNode } from "react"
import { useEffect, useRef } from "react"
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
} from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { useDesignSystem } from "@/components/providers/design-system-provider"
import { MemberQuickActions } from "@/components/member/member-quick-actions"
import { NotificationsMenu } from "@/components/member/notifications-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAnalytics } from "@/lib/hooks/use-analytics"

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
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Discover", href: "/discover", icon: Compass },
  { label: "Chat", href: "/chat", icon: MessageSquare, badge: "3" },
  { label: "Likes", href: "/likes", icon: Heart },
  { label: "Safety", href: "/safety", icon: ShieldCheck },
  { label: "Settings", href: "/settings", icon: Settings },
]

export function MemberAppShell({ children, title, description, actions, contextualNav }: MemberAppShellProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { tokens } = useDesignSystem()
  const { track } = useAnalytics()
  const attributionMemo = useRef<string | null>(null)

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
    <div className="relative flex min-h-screen bg-background text-foreground">
      <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-border bg-card/60">
        <div className="px-6 pb-6 pt-8">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Tribal Mingle
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Your daily member workspace</p>
        </div>

        <div className="px-4">
          <div className="rounded-2xl border border-border bg-card/80 p-4">
            <p className="text-xs font-medium text-muted-foreground">Signed in as</p>
            <p className="mt-1 text-sm font-semibold">
              {user?.name || user?.email || "Member"}
            </p>
            {user?.location && <p className="text-xs text-muted-foreground">{user.location}</p>}
            <Badge variant="secondary" className="mt-3">
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
        </nav>

        <div className="px-4 pb-6">
          <div
            className="rounded-3xl p-5 text-primary-foreground"
            style={{
              backgroundImage: `linear-gradient(130deg, ${tokens.colors.primary} 0%, ${tokens.colors.accent} 100%)`,
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.18)",
            }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider">Boost visibility</p>
            <p className="mt-2 text-base font-semibold">
              Turn on concierge boost to stay on top of your tribe.
            </p>
            <Link
              href="/premium"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wide"
            >
              <Sparkles className="h-4 w-4" /> Upgrade now
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header
          className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur"
          style={{ boxShadow: `0 1px 0 ${tokens.colors.border}` }}
        >
          <div className="mx-auto flex w-full max-w-6xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-10">
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Member workspace</p>
                <Badge variant="outline">Beta</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-lg font-semibold sm:text-2xl">{title ?? "Today"}</h1>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
              </div>
            </div>
            {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
            <NotificationsMenu />
            <div className="flex items-center gap-3 rounded-full border border-border px-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground">Hi</p>
                <p className="text-sm font-semibold leading-tight">{user?.name ?? "Member"}</p>
              </div>
              <Avatar className="h-10 w-10 border border-border">
                <AvatarImage src={user?.profilePhoto ?? undefined} alt={user?.name ?? "Member"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </div>
          {contextualNav ? (
            <div className="border-t border-border bg-background/60">
              <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6 lg:px-10">{contextualNav}</div>
            </div>
          ) : null}
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12">
            <div className="mb-6">
              <MemberQuickActions />
            </div>
            {children}
          </div>
        </main>
      </div>

      <MobileNav pathname={pathname ?? "/"} />
    </div>
  )
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <div className="pointer-events-none lg:hidden">
      <div className="fixed inset-x-0 bottom-3 flex justify-center px-4">
        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-3xl border border-border bg-card/95 px-3 py-2 shadow-2xl shadow-black/20">
          {NAV_ITEMS.slice(0, 4).map((item) => {
            const Icon = item.icon
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-semibold",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
