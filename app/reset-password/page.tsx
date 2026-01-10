"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Eye, EyeOff, MailCheck } from "lucide-react"

const MIN_PASSWORD_LENGTH = 6

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [redirectTo, setRedirectTo] = useState("/login")

  const [email, setEmail] = useState("")
  const [requestLoading, setRequestLoading] = useState(false)
  const [requestMessage, setRequestMessage] = useState("")
  const [requestError, setRequestError] = useState("")

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    if (!token) {
      setError("Your reset link is missing or has expired. Request a new one below.")
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords must match.")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(data.message || "Password updated successfully. You can sign in with your new password.")
        setRedirectTo(data.redirectTo || "/login")
        setPassword("")
        setConfirmPassword("")
      } else {
        setError(data.message || "We couldn't reset your password. Please request a new link and try again.")
      }
    } catch (err) {
      console.error("[reset-password]", err)
      setError("Unexpected error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestLink = async (event: React.FormEvent) => {
    event.preventDefault()
    setRequestError("")
    setRequestMessage("")

    if (!email) {
      setRequestError("Enter the email associated with your account.")
      return
    }

    setRequestLoading(true)
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setRequestMessage(data.message || "If an account exists with this email, we've sent a reset link.")
      } else {
        setRequestError(data.message || "We couldn't send a reset link. Please try again.")
      }
    } catch (err) {
      console.error("[forgot-password]", err)
      setRequestError("Unexpected error. Please try again.")
    } finally {
      setRequestLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-background-primary flex items-center justify-center p-4 relative">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-12 w-40 h-40 md:w-72 md:h-72 bg-purple-royal/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-16 w-44 h-44 md:w-80 md:h-80 bg-gold-warm/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="w-full max-w-3xl grid gap-4 md:grid-cols-[1.6fr_1fr] items-start relative z-10">
        <div className="bg-bg-secondary/60 backdrop-blur-xl rounded-2xl shadow-premium border border-border-gold/30 overflow-hidden">
          <div className="bg-purple-gradient px-6 py-8">
            <div className="flex items-center justify-center">
              <img src="/triballogo.png" alt="Tribal Mingle" className="w-28 h-28 md:w-36 md:h-36 object-contain" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-center text-white mt-3 font-display">Reset your password</h1>
            <p className="text-center text-white/80 text-sm md:text-base mt-2">Create a new password to get back into your account.</p>
          </div>

          <div className="p-6 space-y-4">
            {!token && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-200 text-sm">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Reset link missing or expired</p>
                  <p className="text-red-100/80">Request a fresh link below and use it within the next hour.</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-200 text-sm">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-200 text-sm">
                <CheckCircle2 className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Password updated</p>
                  <p>{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">New password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter a new password"
                    minLength={MIN_PASSWORD_LENGTH}
                    required
                    className="w-full px-4 py-3 pr-12 border-2 border-border-gold/30 bg-bg-tertiary text-text-primary rounded-lg focus:outline-none focus:border-gold-warm focus:ring-4 focus:ring-gold-warm/20 transition-all placeholder:text-text-tertiary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-3 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-text-secondary mt-1">Must be at least {MIN_PASSWORD_LENGTH} characters.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-text-primary">Confirm password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  className="w-full px-4 py-3 border-2 border-border-gold/30 bg-bg-tertiary text-text-primary rounded-lg focus:outline-none focus:border-gold-warm focus:ring-4 focus:ring-gold-warm/20 transition-all placeholder:text-text-tertiary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-gold-gradient text-bg-primary rounded-lg font-bold shadow-glow-gold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating password..." : "Save new password"}
              </button>

              {success && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-text-secondary">All set. Head back to sign in.</p>
                  <button
                    type="button"
                    onClick={() => router.push(redirectTo)}
                    className="w-full px-4 py-3 border border-gold-warm/50 text-gold-warm rounded-lg font-semibold hover:bg-gold-warm/10 transition"
                  >
                    Continue to login
                  </button>
                </div>
              )}
            </form>

            <p className="text-center text-sm text-text-secondary">
              Having trouble? Email <a href="mailto:support@tribalmingle.com" className="text-gold-warm font-semibold hover:text-gold-warm-light">support@tribalmingle.com</a>
            </p>
          </div>
        </div>

        <div className="bg-bg-secondary/60 backdrop-blur-xl rounded-2xl shadow-premium border border-border-gold/30 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <MailCheck className="w-6 h-6 text-gold-warm" />
            <div>
              <h2 className="text-lg font-bold text-text-primary">Need a new link?</h2>
              <p className="text-sm text-text-secondary">Send yourself a fresh password reset email.</p>
            </div>
          </div>

          {requestError && (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/5 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div>{requestError}</div>
            </div>
          )}

          {requestMessage && (
            <div className="flex items-start gap-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-emerald-200 text-sm">
              <CheckCircle2 className="w-5 h-5 mt-0.5" />
              <div>{requestMessage}</div>
            </div>
          )}

          <form onSubmit={handleRequestLink} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-text-primary">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3 border-2 border-border-gold/30 bg-bg-tertiary text-text-primary rounded-lg focus:outline-none focus:border-gold-warm focus:ring-4 focus:ring-gold-warm/20 transition-all placeholder:text-text-tertiary"
              />
            </div>

            <button
              type="submit"
              disabled={requestLoading}
              className="w-full px-4 py-3 border border-gold-warm/60 text-gold-warm rounded-lg font-semibold hover:bg-gold-warm/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requestLoading ? "Sending link..." : "Send reset link"}
            </button>
          </form>

          <div className="text-sm text-text-secondary">
            <p>Check your inbox (and spam folder). The link expires in 1 hour.</p>
          </div>

          <div className="text-center text-sm text-text-secondary">
            <Link href="/login" className="text-gold-warm font-semibold hover:text-gold-warm-light">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
