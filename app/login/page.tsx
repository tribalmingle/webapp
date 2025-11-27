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
    <div className="h-screen overflow-hidden bg-background-primary flex items-center justify-center p-4 relative">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-royal/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold-warm/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="w-full max-w-md max-h-[95vh] bg-bg-secondary/60 backdrop-blur-xl rounded-2xl shadow-premium border border-border-gold/30 overflow-y-auto relative z-10">
        {/* Premium Header Section */}
        <div className="bg-purple-gradient px-6 py-8">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <img src="/triballogo.png" alt="Tribal Mingle" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-center text-white mt-2 font-display">Sign in to your account</h2>
        </div>

        {/* Form Section */}
        <div className="p-6">

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-text-primary">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 border-2 border-border-gold/30 bg-bg-tertiary text-text-primary rounded-lg focus:outline-none focus:border-gold-warm focus:ring-4 focus:ring-gold-warm/20 transition-all placeholder:text-text-tertiary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-text-primary">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                required
                className="w-full px-4 py-3 pr-12 border-2 border-border-gold/30 bg-bg-tertiary text-text-primary rounded-lg focus:outline-none focus:border-gold-warm focus:ring-4 focus:ring-gold-warm/20 transition-all placeholder:text-text-tertiary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-text-secondary hover:text-text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-4 py-3 bg-gold-gradient text-bg-primary rounded-lg font-bold shadow-glow-gold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center mb-4">
          <Link href="#" className="text-gold-warm text-sm font-semibold hover:text-gold-warm-light transition-colors">
            Forgot Password?
          </Link>
        </div>

        <div className="border-t border-border-gold/20 pt-4">
          <p className="text-center text-sm text-text-secondary">
            Don't have an account? <Link href="/sign-up" className="text-gold-warm font-semibold hover:text-gold-warm-light transition-colors">Sign up</Link>
          </p>
        </div>
        </div>
      </div>
    </div>
  )
}
