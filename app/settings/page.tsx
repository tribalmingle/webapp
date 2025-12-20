'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard-spa?view=settings')
  }, [router])
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Redirecting to settings...</p>
    </div>
  )
}

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bell, HelpCircle, Lock, LogOut, Shield, Sparkles, User } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowMessages: true,
  })

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout()
    }
  }

  return (
    <MemberAppShell
      title="Settings"
      description="Control notifications, privacy, and concierge access."
      actions={
        <Button variant="secondary" className="gap-2" onClick={() => router.push('/help')}>
          <HelpCircle className="h-4 w-4" />
          Need help?
        </Button>
      }
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-card/80 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Account</h2>
              <p className="text-sm text-muted-foreground">Update personal details, guardians, and plans.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <SettingsLink href="/profile" label="Edit profile" description="Photos, rituals, family settings" />
            <SettingsLink
              href="/subscription"
              label="Subscription & billing"
              description="Plan, receipts, payment methods"
              badge={user?.subscriptionPlan || 'Free'}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card/80 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Notifications</h2>
              <p className="text-sm text-muted-foreground">Stay on top of concierge alerts and conversation sparks.</p>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <ToggleRow
              label="Email notifications"
              description="Daily digest, concierge invites, receipts"
              checked={settings.emailNotifications}
              onChange={(value) => setSettings((prev) => ({ ...prev, emailNotifications: value }))}
            />
            <ToggleRow
              label="Push notifications"
              description="Real-time sparks + guardian alerts"
              checked={settings.pushNotifications}
              onChange={(value) => setSettings((prev) => ({ ...prev, pushNotifications: value }))}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card/80 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Privacy & Safety</h2>
              <p className="text-sm text-muted-foreground">Control visibility, status, and inbound requests.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold">Profile visibility</label>
              <select
                value={settings.profileVisibility}
                onChange={(event) => setSettings({ ...settings, profileVisibility: event.target.value })}
                className="mt-2 w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm"
              >
                <option value="public">Public</option>
                <option value="members">Members only</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
            <ToggleRow
              label="Show online status"
              description="Display when you are active to your matches"
              checked={settings.showOnlineStatus}
              onChange={(value) => setSettings((prev) => ({ ...prev, showOnlineStatus: value }))}
            />
            <ToggleRow
              label="Allow new messages"
              description="Let verified members reach out"
              checked={settings.allowMessages}
              onChange={(value) => setSettings((prev) => ({ ...prev, allowMessages: value }))}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card/80 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Security</h2>
              <p className="text-sm text-muted-foreground">Reinforce passkeys and guardian approvals.</p>
            </div>
          </div>
          <div className="space-y-3">
            <SettingsButton label="Change password" />
            <SettingsButton label="Setup two-factor authentication" badge="Recommended" />
            <SettingsButton label="Manage blocked members" />
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card/80 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Support & Legal</h2>
              <p className="text-sm text-muted-foreground">Docs, concierge briefings, and safety resources.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <SettingsLink href="/help" label="Help center" description="Guides & FAQ" />
            <SettingsLink href="/safety" label="Safety tips" description="Playbook and escalation" />
            <SettingsLink href="/terms" label="Terms of service" />
            <SettingsLink href="/privacy" label="Privacy policy" />
          </div>
        </section>

        <Button onClick={handleLogout} variant="destructive" className="w-full gap-2 rounded-2xl py-5 text-base font-semibold">
          <LogOut className="h-5 w-5" />
          Log out
        </Button>
      </div>
    </MemberAppShell>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-6">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5"
      />
    </label>
  )
}

function SettingsLink({ href, label, description, badge }: { href: string; label: string; description?: string; badge?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-sm font-semibold transition hover:border-border"
    >
      <div>
        <p>{label}</p>
        {description && <p className="text-xs font-normal text-muted-foreground">{description}</p>}
      </div>
      {badge && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{badge}</span>}
    </Link>
  )
}

function SettingsButton({ label, badge }: { label: string; badge?: string }) {
  return (
    <button className="flex w-full items-center justify-between rounded-2xl border border-border/60 px-4 py-3 text-left text-sm font-semibold hover:border-primary/50">
      {label}
      {badge && <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{badge}</span>}
    </button>
  )
}
