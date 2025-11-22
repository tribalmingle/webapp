'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import Cookies from 'js-cookie'

import { useSessionStore } from '@/lib/state/session-store'
import { UserProfile } from '@/lib/types/user'

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  signup: (userData: any) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  updateUser: (user: UserProfile) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sessionUser = useSessionStore((state) => state.user)
  const setSessionUser = useSessionStore((state) => state.setUser)
  const clearSession = useSessionStore((state) => state.clear)
  const [user, setUser] = useState<UserProfile | null>(sessionUser ?? null)
  const [loading, setLoading] = useState(!sessionUser)

  useEffect(() => {
    if (sessionUser) {
      setUser(sessionUser)
    }
  }, [sessionUser])

  useEffect(() => {
    void checkAuth({ silent: Boolean(sessionUser) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const checkAuth = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    }
    try {
      const token = Cookies.get('auth-token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/me')
      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setSessionUser(data.user)
      } else {
        setUser(null)
        clearSession()
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
      clearSession()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setSessionUser(data.user)
        return { success: true, message: data.message }
      }

      return { success: false, message: data.message }
    } catch (error) {
      return { success: false, message: 'Login failed' }
    }
  }

  const signup = async (userData: any) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        setSessionUser(data.user)
        return { success: true, message: data.message }
      }

      return { success: false, message: data.message }
    } catch (error) {
      return { success: false, message: 'Signup failed' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      clearSession()
      Cookies.remove('auth-token')
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser)
    setSessionUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
