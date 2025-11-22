import { create } from "zustand"
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware"

import type { UserProfile } from "@/lib/types/user"

interface SessionState {
  user: UserProfile | null
  lastSyncedAt?: number
  setUser: (user: UserProfile | null) => void
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
      setUser: (user) => set({ user, lastSyncedAt: user ? Date.now() : undefined }),
      clear: () => set({ user: null, lastSyncedAt: undefined }),
    }),
    {
      name: "tm-member-session",
      storage: createJSONStorage(storageFactory),
      partialize: (state) => ({ user: state.user, lastSyncedAt: state.lastSyncedAt }),
    },
  ),
)
