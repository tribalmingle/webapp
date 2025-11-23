import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"

import type { UserProfile } from "@/lib/types/user"

type InboxFolder = "spark" | "active" | "snoozed" | "trust" | "all"

interface InboxFilters {
  unreadOnly: boolean
  verifiedOnly: boolean
  translatorOnly: boolean
  query: string
}

interface InboxPreferences {
  folder: InboxFolder
  showPinned: boolean
  palette: Record<string, string>
  filters: InboxFilters
}

interface SessionState {
  user: UserProfile | null
  lastSyncedAt?: number
  inboxPreferences: InboxPreferences
  setUser: (user: UserProfile | null) => void
  updateInboxPreferences: (partial: Partial<InboxPreferences>) => void
  clear: () => void
}

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => void 0,
  removeItem: () => void 0,
}

const storageFactory = () => {
  if (typeof window === "undefined") {
    return noopStorage
  }
  return window.localStorage
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      lastSyncedAt: undefined,
      inboxPreferences: {
        folder: "spark",
        showPinned: true,
        palette: {
          spark: "from-pink-500/20 to-orange-500/20",
          active: "from-primary/10 to-primary/5",
          snoozed: "from-muted/40 to-muted/10",
          trust: "from-amber-500/20 to-red-500/10",
          all: "from-slate-100 to-slate-50",
        },
        filters: {
          unreadOnly: false,
          verifiedOnly: false,
          translatorOnly: false,
          query: "",
        },
      },
      setUser: (user) => set({ user, lastSyncedAt: user ? Date.now() : undefined }),
      updateInboxPreferences: (partial) =>
        set((state) => ({ inboxPreferences: { ...state.inboxPreferences, ...partial } })),
      clear: () => set({ user: null, lastSyncedAt: undefined }),
    }),
    {
      name: "tm-member-session",
      storage: createJSONStorage(storageFactory),
      partialize: (state) => ({
        user: state.user,
        lastSyncedAt: state.lastSyncedAt,
        inboxPreferences: state.inboxPreferences,
      }),
    },
  ),
)
