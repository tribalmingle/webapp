"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, CheckCircle2, Flame, MessageCircle, Sparkles } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "tm-shell-notifications"

type NotificationCategory = "match" | "event" | "system"

interface NotificationItem {
  id: string
  title: string
  body: string
  createdAt: string
  category: NotificationCategory
  href?: string
  read?: boolean
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "tribe-match",
    title: "New tribe match",
    body: "Ama from the Ashanti tribe has a 94% compatibility score.",
    createdAt: new Date().toISOString(),
    category: "match",
    href: "/discover",
  },
  {
    id: "event-reminder",
    title: "Concierge salon tonight",
    body: "RSVP closes in 2 hours for Nairobi Founders & Foodies.",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    category: "event",
    href: "/events",
  },
  {
    id: "boost-tip",
    title: "Boost suggestion",
    body: "You moved up 12 spots after yesterday's spotlight. Try it again this weekend.",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    category: "system",
    href: "/premium",
  },
]

function hydrateNotifications(): NotificationItem[] {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATIONS
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return DEFAULT_NOTIFICATIONS
    }
    const parsed = JSON.parse(stored) as NotificationItem[]
    return parsed.length ? parsed : DEFAULT_NOTIFICATIONS
  } catch (error) {
    console.warn("[member-shell] failed to load notifications", error)
    return DEFAULT_NOTIFICATIONS
  }
}

export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => hydrateNotifications())

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
    } catch (error) {
      console.warn("[member-shell] failed to persist notifications", error)
    }
  }, [notifications])

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  const handleMarkAll = () => {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })))
  }

  const handleDismiss = (id: string) => {
    setNotifications((items) => items.filter((item) => item.id !== id))
  }

  const handleMarkRead = (id: string) => {
    setNotifications((items) => items.map((item) => (item.id === id ? { ...item, read: true } : item)))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-semibold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-border/70 p-0" align="end">
        <header className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-muted-foreground">Stay in sync with your concierge</p>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleMarkAll}>
              Mark all read
            </Button>
          )}
        </header>
        <div className="max-h-80 divide-y divide-border/60 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10" />
              <p className="text-sm">You're all caught up</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <article key={notification.id} className="flex gap-3 px-4 py-3">
                <CategoryIcon category={notification.category} />
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold leading-tight">{notification.title}</h3>
                      <p className="text-xs text-muted-foreground">{notification.body}</p>
                    </div>
                    <button
                      type="button"
                      className="text-[11px] text-muted-foreground transition hover:text-foreground"
                      onClick={() => handleDismiss(notification.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[11px] capitalize">
                      {notification.category}
                    </Badge>
                    {!notification.read && (
                      <button
                        type="button"
                        className="text-[11px] font-semibold text-primary"
                        onClick={() => handleMarkRead(notification.id)}
                      >
                        Mark read
                      </button>
                    )}
                    {notification.href && (
                      <Link
                        href={notification.href}
                        className="text-[11px] font-semibold text-accent underline-offset-2 hover:underline"
                      >
                        Open
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function CategoryIcon({ category }: { category: NotificationCategory }) {
  const baseClasses = "flex h-9 w-9 items-center justify-center rounded-full"
  switch (category) {
    case "match":
      return (
        <span className={cn(baseClasses, "bg-pink-100 text-pink-600 dark:bg-pink-400/20 dark:text-pink-200")}>
          <MessageCircle className="h-4 w-4" />
        </span>
      )
    case "event":
      return (
        <span className={cn(baseClasses, "bg-amber-100 text-amber-600 dark:bg-amber-400/20 dark:text-amber-200")}>
          <Flame className="h-4 w-4" />
        </span>
      )
    default:
      return (
        <span className={cn(baseClasses, "bg-primary/10 text-primary")}>
          <Sparkles className="h-4 w-4" />
        </span>
      )
  }
}
