'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Upload, X } from 'lucide-react'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FEATURED_TRIBES } from '@/lib/constants/profile-options'

type EditProfileForm = {
  name: string
  age: number
  bio: string
  tribe: string
  location: string
  job: string
  interests: string[]
}

const INITIAL_STATE: EditProfileForm = {
  name: 'Sarah Anderson',
  age: 32,
  bio: 'Creative director with a passion for art, travel, and meaningful connections.',
  tribe: 'Igbo',
  location: 'New York, USA',
  job: 'Creative Director at Design Studio',
  interests: ['Art', 'Travel', 'Yoga', 'Cooking', 'Photography', 'Music'],
}

export default function EditProfilePage() {
  const router = useRouter()
  const [formData, setFormData] = useState<EditProfileForm>(INITIAL_STATE)
  const [newInterest, setNewInterest] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleAddInterest = () => {
    if (!newInterest.trim()) return
    setFormData((prev) => ({ ...prev, interests: [...prev.interests, newInterest.trim()] }))
    setNewInterest('')
  }

  const handleRemoveInterest = (interest: string) => {
    setFormData((prev) => ({ ...prev, interests: prev.interests.filter((item) => item !== interest) }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Unable to update profile')
      }

      setMessage('Profile updated successfully')
      setTimeout(() => router.push('/profile'), 800)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  const shellActions = (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => router.push('/profile')}>
        Cancel
      </Button>
      <Button onClick={handleSave} disabled={isSaving} className="min-w-[8rem]">
        {isSaving ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  )

  return (
    <MemberAppShell title="Edit profile" description="Refresh your story, rituals, and concierge view." actions={shellActions}>
      <div className="space-y-8">
        <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
          <Link href="/profile" className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to profile
          </Link>
        </Button>

        {message && (
          <div
            className={`rounded-3xl border px-4 py-3 text-sm ${
              message.includes('successfully') ? 'border-green-200 bg-green-50 text-green-900' : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            {message}
          </div>
        )}

        <SectionCard title="Photos" description="Upload at least three recent portraits and lifestyle moments.">
          <div className="grid gap-4 sm:grid-cols-3">
            {[1, 2, 3].map((slot) => (
              <PhotoTile key={slot} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Basic information" description="Fill in the details guardians and concierge teams review first.">
          <div className="space-y-4">
            <Field label="Full name">
              <Input value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Age">
                <Input
                  type="number"
                  value={formData.age}
                  onChange={(event) => setFormData({ ...formData, age: Number(event.target.value) })}
                />
              </Field>
              <Field label="Location">
                <Input value={formData.location} onChange={(event) => setFormData({ ...formData, location: event.target.value })} />
              </Field>
            </div>
            <Field label="Tribe">
              <select
                className="w-full rounded-2xl border border-border bg-transparent px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                value={formData.tribe}
                onChange={(event) => setFormData({ ...formData, tribe: event.target.value })}
              >
                {FEATURED_TRIBES.map((tribe) => (
                  <option key={tribe} value={tribe}>
                    {tribe}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Job title">
              <Input value={formData.job} onChange={(event) => setFormData({ ...formData, job: event.target.value })} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="About you" description="Share your story. Guardians and concierge teams use this to curate intros.">
          <Textarea
            value={formData.bio}
            maxLength={500}
            onChange={(event) => setFormData({ ...formData, bio: event.target.value })}
            className="min-h-[8rem]"
            placeholder="Tell us about yourself"
          />
          <p className="text-right text-xs text-muted-foreground">{formData.bio.length}/500</p>
        </SectionCard>

        <SectionCard title="Interests & rituals" description="Highlight sparks that help matches reach out with context.">
          <div className="flex flex-wrap gap-2">
            {formData.interests.map((interest) => (
              <span key={interest} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-sm">
                {interest}
                <button type="button" className="text-muted-foreground" onClick={() => handleRemoveInterest(interest)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {!formData.interests.length && <p className="text-sm text-muted-foreground">Add at least three interests.</p>}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={newInterest}
              onChange={(event) => setNewInterest(event.target.value)}
              placeholder="Add an interest"
              className="flex-1"
            />
            <Button onClick={handleAddInterest} variant="secondary" className="sm:w-auto">
              Add interest
            </Button>
          </div>
        </SectionCard>
      </div>
    </MemberAppShell>
  )
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-3xl border border-border bg-card/80 p-6">
      <div className="mb-4 space-y-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function PhotoTile() {
  return (
    <button
      type="button"
      className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground transition hover:border-accent"
    >
      <Upload className="h-5 w-5" />
      Add photo
    </button>
  )
}
