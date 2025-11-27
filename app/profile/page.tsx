'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle, Clock, Edit2, HelpCircle, MapPin, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { FEATURED_TRIBES } from '@/lib/constants/profile-options'

type ProfileFormState = {
  name: string
  bio: string
  age: number
  dateOfBirth: string
  gender: string
  tribe: string
  country: string
  city: string
  maritalStatus: string
  height: string
  bodyType: string
  education: string
  occupation: string
  religion: string
  lookingFor: string
  interests: string
  profilePhotos: string[]
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState<ProfileFormState>(() => buildInitialState(user))

  useEffect(() => {
    if (user) {
      setFormData(buildInitialState(user))
    }
  }, [user])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    if (formData.profilePhotos.length + files.length > 10) {
      setMessage('You can only upload up to 10 photos')
      return
    }

    const uploads: string[] = []
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        uploads.push(reader.result as string)
        if (uploads.length === files.length) {
          setFormData((prev) => ({ ...prev, profilePhotos: [...prev.profilePhotos, ...uploads] }))
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => ({ ...prev, profilePhotos: prev.profilePhotos.filter((_, i) => i !== index) }))
  }

  const handleSave = async () => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          interests: formData.interests
            .split(',')
            .map((interest) => interest.trim())
            .filter(Boolean),
        }),
      })

      const data = await response.json()

      if (data.success) {
        updateUser(data.user)
        setMessage('Profile updated successfully!')
        setIsEditing(false)
      } else {
        setMessage(data.message || 'Failed to update profile')
      }
    } catch (error) {
      setMessage('Error updating profile')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  const actionBar = (
    <div className="flex flex-wrap gap-3">
      <Button variant="ghost" className="gap-2" onClick={() => router.push('/help')}>
        <HelpCircle className="h-4 w-4" />
        Concierge help
      </Button>
      <Button variant={isEditing ? 'outline' : 'default'} className="gap-2" onClick={() => setIsEditing((prev) => !prev)}>
        {isEditing ? (
          <>
            <X className="h-4 w-4" /> Cancel edit
          </>
        ) : (
          <>
            <Edit2 className="h-4 w-4" /> Edit profile
          </>
        )}
      </Button>
    </div>
  )

  return (
    <MemberAppShell title="Profile" description="Tune your rituals, story, and concierge view." actions={actionBar}>
      <div className="space-y-6">
        <section className="rounded-3xl border border-border bg-card/80 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-primary to-accent text-3xl font-bold text-white">
                  {formData.profilePhotos[0] ? (
                    <img src={formData.profilePhotos[0]} alt={`${user.name} profile photo`} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    user.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <div className={`absolute -bottom-1 -right-1 rounded-full p-1 ${user.verified ? 'bg-green-500' : 'bg-yellow-500'}`}>
                  {user.verified ? <CheckCircle className="h-5 w-5 text-white" /> : <Clock className="h-5 w-5 text-white" />}
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold">{user.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {user.age ? `${user.age} years · ` : ''}
                  {user.city || 'Location not set'}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  {formData.tribe || 'Select your tribe'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {formData.country || 'Country not set'}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {user.verified ? 'Verified profile' : 'Pending verification'}
              </div>
            </div>
          </div>

          {message && (
            <div
              className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
                message.includes('success') ? 'border-green-200 bg-green-50 text-green-900' : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {message}
            </div>
          )}
        </section>

        {isEditing ? (
          <ProfileEditor
            formData={formData}
            loading={loading}
            onChange={handleInputChange}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            onRemovePhoto={removePhoto}
            onTriggerUpload={() => fileInputRef.current?.click()}
            fileInputRef={fileInputRef}
            onUpload={handleImageUpload}
          />
        ) : (
          <ProfileOverview formData={formData} />
        )}
      </div>
    </MemberAppShell>
  )
}

function buildInitialState(user: ReturnType<typeof useAuth>['user']): ProfileFormState {
  return {
    name: user?.name || '',
    bio: user?.bio || '',
    age: user?.age || 0,
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || 'male',
    tribe: user?.tribe || '',
    country: user?.country || '',
    city: user?.city || '',
    maritalStatus: user?.maritalStatus || '',
    height: user?.height || '',
    bodyType: user?.bodyType || '',
    education: user?.education || '',
    occupation: user?.occupation || '',
    religion: user?.religion || '',
    lookingFor: user?.lookingFor || '',
    interests: user?.interests?.join(', ') || '',
    profilePhotos: user?.profilePhotos || [],
  }
}

function ProfileEditor({
  formData,
  loading,
  onChange,
  onSave,
  onCancel,
  onRemovePhoto,
  onTriggerUpload,
  fileInputRef,
  onUpload,
}: {
  formData: ProfileFormState
  loading: boolean
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  onSave: () => Promise<void> | void
  onCancel: () => void
  onRemovePhoto: (index: number) => void
  onTriggerUpload: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void
}) {
  return (
    <section className="rounded-3xl border border-border bg-card/80 p-6">
      <div className="space-y-8">
        <div>
          <Label>Profile photos (up to 10)</Label>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
            {formData.profilePhotos.map((photo, index) => (
              <div key={photo + index} className="relative aspect-square overflow-hidden rounded-2xl border border-border/60">
                <img src={photo} alt={`Profile photo ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index)}
                  className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-xs text-red-500 shadow"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {formData.profilePhotos.length < 10 && (
              <button
                type="button"
                onClick={onTriggerUpload}
                className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-sm text-muted-foreground transition hover:border-primary"
              >
                <Camera className="mb-2 h-6 w-6" />
                Add photo
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onUpload} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Full name" name="name" value={formData.name} onChange={onChange} component="input" />
          <Field label="Date of birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={onChange} component="input" />
        </div>

        <Field label="Bio" name="bio" value={formData.bio} onChange={onChange} component="textarea" rows={4} placeholder="Tell the concierge what to highlight..." />

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Country" name="country" value={formData.country} onChange={onChange} component="input" />
          <Field label="City" name="city" value={formData.city} onChange={onChange} component="input" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SelectField label="Gender" name="gender" value={formData.gender} onChange={onChange} options={['male', 'female', 'other']} />
          <SelectField label="Marital status" name="maritalStatus" value={formData.maritalStatus} onChange={onChange} options={['single', 'divorced', 'widowed']} allowEmpty />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Height" name="height" value={formData.height} onChange={onChange} component="input" placeholder="e.g., 5 ft 10 in" />
          <SelectField
            label="Body type"
            name="bodyType"
            value={formData.bodyType}
            onChange={onChange}
            options={['slim', 'athletic', 'average', 'curvy', 'heavyset']}
            allowEmpty
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Education" name="education" value={formData.education} onChange={onChange} component="input" placeholder="e.g., Bachelor's degree" />
          <Field label="Occupation" name="occupation" value={formData.occupation} onChange={onChange} component="input" placeholder="e.g., Product designer" />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SelectField
            label="Tribe"
            name="tribe"
            value={formData.tribe}
            onChange={onChange}
            options={FEATURED_TRIBES}
            allowEmpty
          />
          <Field label="Religion" name="religion" value={formData.religion} onChange={onChange} component="input" placeholder="e.g., Christian" />
        </div>

        <Field label="Looking for" name="lookingFor" value={formData.lookingFor} onChange={onChange} component="input" placeholder="e.g., Long-term relationship" />

        <Field
          label="Interests (comma separated)"
          name="interests"
          value={formData.interests}
          onChange={onChange}
          component="input"
          placeholder="Travel, Ayurveda, Live jazz"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onSave} disabled={loading} className="flex-1">
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </section>
  )
}

function ProfileOverview({ formData }: { formData: ProfileFormState }) {
  const interestChips = formData.interests
    .split(',')
    .map((interest) => interest.trim())
    .filter(Boolean)

  const infoSections = [
    {
      title: 'Personal details',
      items: [
        { label: 'Gender', value: capitalize(formData.gender) },
        { label: 'Marital status', value: formData.maritalStatus || 'Not set' },
        { label: 'Looking for', value: formData.lookingFor || 'Not set' },
      ],
    },
    {
      title: 'Lifestyle',
      items: [
        { label: 'Height', value: formData.height || 'Not set' },
        { label: 'Body type', value: formData.bodyType || 'Not set' },
        { label: 'Religion', value: formData.religion || 'Not set' },
      ],
    },
    {
      title: 'Professional',
      items: [
        { label: 'Education', value: formData.education || 'Not set' },
        { label: 'Occupation', value: formData.occupation || 'Not set' },
        { label: 'Tribe', value: formData.tribe || 'Not set' },
      ],
    },
    {
      title: 'Location',
      items: [
        { label: 'Country', value: formData.country || 'Not set' },
        { label: 'City', value: formData.city || 'Not set' },
      ],
    },
  ]

  return (
    <div className="space-y-6">
      {formData.profilePhotos.length > 0 && (
        <section className="rounded-3xl border border-border bg-card/80 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Photos</p>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {formData.profilePhotos.map((photo, index) => (
              <img key={photo + index} src={photo} alt={`Profile photo ${index + 1}`} className="aspect-square w-full rounded-2xl object-cover" />
            ))}
          </div>
        </section>
      )}

      {formData.bio && (
        <section className="rounded-3xl border border-border bg-card/80 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">About</p>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{formData.bio}</p>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {infoSections.map((section) => (
          <div key={section.title} className="rounded-3xl border border-border bg-card/80 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</p>
            <dl className="mt-4 space-y-3 text-sm">
              {section.items.map((item) => (
                <div key={item.label} className="flex justify-between">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium text-right">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </section>

      {interestChips.length > 0 && (
        <section className="rounded-3xl border border-border bg-card/80 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Interests</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {interestChips.map((interest) => (
              <span key={interest} className="rounded-full border border-border/70 px-3 py-1 text-xs font-semibold">
                {interest}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Field({
  label,
  component,
  ...props
}: {
  label: string
  component: 'input' | 'textarea'
  name: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  type?: string
  rows?: number
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {component === 'textarea' ? <Textarea {...props} /> : <Input {...props} />}
    </div>
  )
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  allowEmpty,
}: {
  label: string
  name: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: string[]
  allowEmpty?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-border bg-background/70 px-4 py-3 text-sm"
      >
        {allowEmpty && <option value="">Select</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

function capitalize(value: string) {
  if (!value) return 'Not set'
  return value.charAt(0).toUpperCase() + value.slice(1)
}
