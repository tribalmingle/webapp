'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Heart, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const result = await login(email, password)
      if (result.success) {
        router.push('/dashboard-spa')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-background to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[95vh] bg-white rounded-2xl shadow-lg overflow-y-auto">
        {/* Dark Purple Header Section */}
        <div className="bg-purple-900 px-6 py-3">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <img src="/triballogo.png" alt="Tribal Mingle" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-center text-white mt-1">Sign in to your account</h2>
        </div>

        {/* White Form Section */}
        <div className="p-5">

        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 mb-3">
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-4 py-2.5 bg-accent text-accent-foreground rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50 text-sm mt-4"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mb-3">
          <Link href="#" className="text-accent text-sm font-semibold hover:underline">
            Forgot Password?
          </Link>
        </div>

        <div className="border-t border-border pt-3">
          <p className="text-center text-xs text-muted-foreground">
            Don't have an account? <Link href="/sign-up" className="text-accent font-semibold hover:underline">Sign up</Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
