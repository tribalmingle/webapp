"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Camera, Compass, ShieldCheck, Sparkles, X } from "lucide-react"

import { useSessionStore } from "@/lib/state/session-store"
import { cn } from "@/lib/utils"

interface QuickActionItem {
  id: string
  title: string
  description: string
  actionLabel: string
  actionHref: string
  icon: typeof Sparkles
}

interface MemberQuickActionsProps {
  onNavigate?: (href: string) => void
}

const STORAGE_KEY = "tm-shell-dismissed-actions"

function getInitialDismissed(): string[] {
  if (typeof window === "undefined") {
    return []
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch (error) {
    console.warn("[member-shell] failed to parse dismissed actions", error)
    return []
  }
}

export function MemberQuickActions({ onNavigate }: MemberQuickActionsProps = {}) {
  const user = useSessionStore((state) => state.user)
  const [dismissed, setDismissed] = useState<string[]>(() => getInitialDismissed())

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed))
    } catch (error) {
      console.warn("[member-shell] failed to persist dismissed actions", error)
    }
  }, [dismissed])

  const actions = useMemo(() => {
    const items: QuickActionItem[] = []
    const profileFilled = Boolean(user?.bio && user?.bio.length > 40 && user?.profilePhotos?.length)

    if (!user?.verified) {
      items.push({
        id: "verify-account",
        title: "Verify your account",
        description: "Add a selfie and confirm your identity so matches trust your profile.",
        actionLabel: "Verify now",
        actionHref: "/dashboard-spa?view=safety",
        icon: ShieldCheck,
      })
    }

    if (!profileFilled) {
      items.push({
        id: "finish-profile",
        title: "Complete your story",
        description: "Upload photos and add more details so the concierge can boost you.",
        actionLabel: "Update profile",
        actionHref: "/dashboard-spa?view=profile",
        icon: Camera,
      })
    }

    if (!user?.tribe || !user?.lookingFor) {
      items.push({
        id: "choose-tribe",
        title: "Pick your tribe",
        description: "Tell us the communities and intentions you vibe with to refine matches.",
        actionLabel: "Edit preferences",
        actionHref: "/dashboard-spa?view=discover",
        icon: Compass,
      })
    }

    if (!user?.subscriptionPlan || user.subscriptionPlan === "free") {
      items.push({
        id: "upgrade-plan",
        title: "Unlock concierge perks",
        description: "Boost visibility, read receipts, and weekly curated intros with Premium.",
        actionLabel: "View plans",
        actionHref: "/dashboard-spa?view=subscription",
        icon: Sparkles,
      })
    }

    return items
  }, [user])

  const visibleActions = actions.filter((action) => !dismissed.includes(action.id))

  if (visibleActions.length === 0) {
    return null
  }

  const handleDismiss = (id: string) => {
    setDismissed((prev) => Array.from(new Set([...prev, id])))
  }

  const handleReset = () => {
    setDismissed([])
  }

  return (
    <section className="rounded-2xl lg:rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-3 sm:p-4 shadow-sm">
      <div className="mb-3 sm:mb-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick actions</p>
          <p className="text-sm sm:text-base font-semibold">Finish setup to improve your match score</p>
        </div>
        {dismissed.length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="ml-auto text-xs font-semibold text-muted-foreground underline-offset-2 hover:underline"
          >
            Reset hidden tasks
          </button>
        )}
      </div>
      <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2 xl:grid-cols-4">
        {visibleActions.map((action) => {
          const Icon = action.icon
          return (
            <article
              key={action.id}
              className="flex flex-col gap-2.5 sm:gap-3 rounded-xl sm:rounded-2xl border border-border/70 bg-background/70 backdrop-blur-sm p-3 sm:p-4"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-semibold leading-tight">{action.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{action.description}</p>
                </div>
                <button
                  type="button"
                  className="text-muted-foreground transition hover:text-foreground shrink-0"
                  aria-label="Dismiss quick action"
                  onClick={() => handleDismiss(action.id)}
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                {onNavigate ? (
                  <button
                    onClick={() => onNavigate(action.actionHref)}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold",
                      "bg-primary text-primary-foreground transition hover:bg-primary/90",
                    )}
                  >
                    {action.actionLabel}
                  </button>
                ) : (
                  <Link
                    href={action.actionHref}
                    className={cn(
                      "inline-flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold",
                      "bg-primary text-primary-foreground transition hover:bg-primary/90",
                    )}
                  >
                    {action.actionLabel}
                  </Link>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
