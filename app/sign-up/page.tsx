'use client'

import { startRegistration } from '@simplewebauthn/browser'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { TrialUpsellCard, TrialUpsellContext } from '@/components/onboarding/trial-upsell'
import {
  COUNTRIES,
  getCitiesForCountry,
  AFRICAN_COUNTRIES_WITH_TRIBES,
  getTribesForCountry,
  HEIGHTS_IN_FEET,
  EDUCATION_LEVELS,
  RELIGIONS,
  LOOKING_FOR_OPTIONS,
  INTERESTS_OPTIONS,
  MARITAL_STATUS_OPTIONS
} from '@/lib/constants/profile-options'
import { COMPATIBILITY_QUESTIONS, DEFAULT_COMPATIBILITY_VALUE } from '@/lib/constants/compatibility-quiz'

type CompatibilityQuizResult = {
  prospectId: string
  overallScore: number
  dimensionScores: Array<{ dimension: string; label: string; score: number }>
  personas: Array<{ id: string; label: string; summary: string; score: number }>
  insights: string[]
  savedAt: string
}

type MediaTypeKey = 'id' | 'selfie' | 'voice' | 'video'
type MediaUploadStatus = 'idle' | 'requesting' | 'uploading' | 'scoring' | 'approved' | 'flagged' | 'error'

type MediaUploadState = {
  previewUrl?: string
  uploadKey?: string
  fileUrl?: string
  status: MediaUploadStatus
  message?: string
  aiScore?: number
}

const STEP_COUNT = 7
const STEP_INDICATORS = Array.from({ length: STEP_COUNT }, (_, index) => index + 1)

const buildDefaultQuizState = () => {
  return COMPATIBILITY_QUESTIONS.reduce<Record<string, number>>((state, question) => {
    state[question.id] = DEFAULT_COMPATIBILITY_VALUE
    return state
  }, {})
}

const buildInitialMediaState = (): Record<MediaTypeKey, MediaUploadState> => ({
  id: { status: 'idle' },
  selfie: { status: 'idle' },
  voice: { status: 'idle' },
  video: { status: 'idle' },
})

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string>('free')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [prospectId, setProspectId] = useState<string | null>(null)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>(buildDefaultQuizState)
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityQuizResult | null>(null)
  const [compatibilitySaving, setCompatibilitySaving] = useState(false)
  const [mediaState, setMediaState] = useState<Record<MediaTypeKey, MediaUploadState>>(buildInitialMediaState)
  const mediaStateRef = useRef(mediaState)
  const [trialInterest, setTrialInterest] = useState<Record<TrialUpsellContext, boolean>>({
    security: false,
    media: false,
    plan: false,
  })
    const mediaStatusConfig: Record<MediaUploadStatus, { label: string; badge: string }> = {
      idle: { label: 'Not uploaded', badge: 'bg-muted text-muted-foreground' },
      requesting: { label: 'Preparing upload…', badge: 'bg-blue-50 text-blue-700' },
      uploading: { label: 'Uploading…', badge: 'bg-blue-50 text-blue-700' },
      scoring: { label: 'Analyzing…', badge: 'bg-amber-50 text-amber-700' },
      approved: { label: 'Approved', badge: 'bg-green-50 text-green-700' },
      flagged: { label: 'Needs attention', badge: 'bg-amber-100 text-amber-900' },
      error: { label: 'Upload failed', badge: 'bg-red-50 text-red-700' },
    };
  const [passkeyState, setPasskeyState] = useState<'idle' | 'processing' | 'verified' | 'error'>('idle')
  const [passkeyError, setPasskeyError] = useState('')
  const [passkeyAvailable, setPasskeyAvailable] = useState(false)
  const [passkeyBypass, setPasskeyBypass] = useState(false)
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'sending' | 'code_sent' | 'verifying' | 'verified'>('idle')
  const [phoneCode, setPhoneCode] = useState('')
  const [phoneMessage, setPhoneMessage] = useState('')
  const idInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)
  const voiceInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const trialImpressionRef = useRef<Set<TrialUpsellContext>>(new Set())

  const emitTrialAnalytics = (event: 'view' | 'cta_click', context: TrialUpsellContext) => {
    if (typeof window !== 'undefined') {
      console.debug('onboarding.trial.event', { event, context })
    }
  }

  const handleTrialInterest = (context: TrialUpsellContext) => {
    setTrialInterest((prev) => {
      if (prev[context]) return prev
      return { ...prev, [context]: true }
    })
    emitTrialAnalytics('cta_click', context)
  }
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedProspectId = sessionStorage.getItem('onboardingProspectId')
    if (storedProspectId) {
      setProspectId(storedProspectId)
    }

    if ('PublicKeyCredential' in window) {
      setPasskeyAvailable(true)
    } else {
      setPasskeyBypass(true)
    }
  }, [])

  useEffect(() => {
    mediaStateRef.current = mediaState
  }, [mediaState])

  useEffect(() => {
    return () => {
      Object.values(mediaStateRef.current).forEach((entry) => {
        if (entry.previewUrl && entry.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(entry.previewUrl)
        }
      })
    }
  }, [])

  useEffect(() => {
    const contextForStep: Record<number, TrialUpsellContext | null> = {
      5: 'security',
      6: 'media',
      7: 'plan',
    }
    const context = contextForStep[step] ?? null
    if (context && !trialImpressionRef.current.has(context)) {
      trialImpressionRef.current.add(context)
      emitTrialAnalytics('view', context)
    }
  }, [step])

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    dob: '',
    gender: '',
    maritalStatus: '',
    country: '',
    city: '',
    tribe: '',
    countryOfOrigin: '',
    cityOfOrigin: '',
    height: '',
    education: '',
    religion: '',
    lookingFor: '',
    interests: [] as string[]
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Reset dependent fields
    if (name === 'countryOfOrigin') {
      setFormData(prev => ({ ...prev, tribe: '' }))
    }
    if (name === 'country') {
      setFormData(prev => ({ ...prev, city: '' }))
    }

    // Validate age when DOB changes
    if (name === 'dob' && value) {
      const age = calculateAge(value)
      if (age < 30) {
        setError('You must be 30 years or older to use this platform')
      } else {
        setError('')
      }
    }
  }

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleMediaSelection = async (mediaType: MediaTypeKey, file?: File) => {
    if (!file) return
    if (!formData.email) {
      setError('Add your email before uploading verification media')
      return
    }

    const contentType = file.type || 'application/octet-stream'

    setMediaState((prev) => {
      const previousPreview = prev[mediaType]?.previewUrl
      if (previousPreview && previousPreview.startsWith('blob:')) {
        URL.revokeObjectURL(previousPreview)
      }
      return {
        ...prev,
        [mediaType]: {
          status: 'requesting',
          message: 'Generating secure upload link...'
        },
      }
    })

    try {
      const response = await fetch('/api/onboarding/media/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          mediaType,
          contentType,
          prospectId,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to request upload link')
      }

      const resolvedProspectId: string | null = data.prospectId ?? prospectId
      if (resolvedProspectId) {
        persistProspectId(resolvedProspectId)
      } else {
        throw new Error('Prospect ID missing for media upload request')
      }

      const previewUrl = URL.createObjectURL(file)

      setMediaState((prev) => ({
        ...prev,
        [mediaType]: {
          ...prev[mediaType],
          status: 'uploading',
          message: 'Uploading securely...',
          uploadKey: data.key,
          fileUrl: data.fileUrl,
          previewUrl,
        },
      }))

      if (!data.uploadUrl) {
        throw new Error('Upload URL missing')
      }

      if (!data.uploadUrl.includes('example.com')) {
        const uploadResponse = await fetch(data.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
          },
          body: file,
        })

        if (!uploadResponse.ok) {
          throw new Error('Upload failed')
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400))
      }

      setMediaState((prev) => ({
        ...prev,
        [mediaType]: {
          ...prev[mediaType],
          status: 'scoring',
          message: 'Applying AI verification...',
        },
      }))

      const aiHints = {
        quality: Number(Math.min(file.size / (1024 * 1024 * 5), 1).toFixed(2)),
      }

      const finalizeResponse = await fetch('/api/onboarding/media/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectId: resolvedProspectId,
          uploadKey: data.key,
          mediaType,
          aiHints,
        }),
      })

      const finalizeData = await finalizeResponse.json()
      if (!finalizeResponse.ok) {
        throw new Error(finalizeData.error || 'Unable to finalize upload')
      }

      if (finalizeData.prospectId) {
        persistProspectId(finalizeData.prospectId)
      }

      const approved = typeof finalizeData.aiScore === 'number' ? finalizeData.aiScore >= 0.6 : true

      setMediaState((prev) => ({
        ...prev,
        [mediaType]: {
          ...prev[mediaType],
          status: approved ? 'approved' : 'flagged',
          message: approved ? 'Looks great. Thanks!' : 'Needs a clearer capture. Try again.',
          aiScore: finalizeData.aiScore,
        },
      }))
    } catch (err) {
      console.error('Media upload failed', err)
      setMediaState((prev) => ({
        ...prev,
        [mediaType]: {
          ...prev[mediaType],
          status: 'error',
          message: 'Upload failed. Please retry.',
        },
      }))
    }
  }

  const persistProspectId = (value: string) => {
    setProspectId(value)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('onboardingProspectId', value)
    }
  }

  const handleQuizAnswerChange = (questionId: string, value: number) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: value }))
    setCompatibilityResult(null)
  }

  const handleSaveCompatibility = async () => {
    if (!formData.email) {
      setError('Add your email before saving compatibility insights')
      return false
    }

    setCompatibilitySaving(true)
    setError('')

    try {
      const response = await fetch('/api/onboarding/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: prospectId,
          email: formData.email,
          answers: COMPATIBILITY_QUESTIONS.map((question) => ({
            promptId: question.id,
            value: quizAnswers[question.id] ?? DEFAULT_COMPATIBILITY_VALUE,
          })),
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Unable to save compatibility insights')
        return false
      }

      setCompatibilityResult(data)
      if (data.prospectId) {
        persistProspectId(data.prospectId)
      }

      return true
    } catch (err) {
      console.error('Compatibility save failed', err)
      setError('Unable to save compatibility insights. Please try again.')
      return false
    } finally {
      setCompatibilitySaving(false)
    }
  }

  const handleRegisterPasskey = async () => {
    if (!passkeyAvailable) {
      setPasskeyError('Passkeys are not supported on this device')
      setPasskeyBypass(true)
      return
    }

    if (!formData.email) {
      setError('Please add your email before creating a passkey')
      return
    }

    try {
      setError('')
      setPasskeyError('')
      setPasskeyState('processing')

      const challengeResponse = await fetch('/api/onboarding/passkey/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, prospectId })
      })

      const challengeData = await challengeResponse.json()
      if (!challengeResponse.ok) {
        throw new Error(challengeData.error || 'Unable to start passkey enrollment')
      }

      const attestation = await startRegistration(challengeData.options)

      const registerResponse = await fetch('/api/onboarding/passkey/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          prospectId: challengeData.prospectId,
          attestation
        })
      })

      const registerData = await registerResponse.json()
      if (!registerResponse.ok || !registerData.verified) {
        throw new Error(registerData.error || 'Passkey verification failed')
      }

      if (challengeData.prospectId) {
        persistProspectId(challengeData.prospectId)
      }

      setPasskeyState('verified')
      setPasskeyError('')
    } catch (err) {
      console.error('Passkey registration failed', err)
      setPasskeyState('error')
      setPasskeyError('Unable to complete passkey enrollment. Please try again or skip for now.')
    }
  }

  const handleSkipPasskey = () => {
    setPasskeyBypass(true)
    setPasskeyError('')
  }

  const handleSendPhoneCode = async () => {
    if (!formData.email || !formData.phone) {
      setError('Please provide both email and phone number to request a code')
      return
    }

    try {
      setError('')
      setPhoneMessage('')
      setPhoneStatus('sending')

      const response = await fetch('/api/onboarding/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, phone: formData.phone, prospectId })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Unable to send verification code')
      }

      if (data.prospectId) {
        persistProspectId(data.prospectId)
      }

      setPhoneStatus('code_sent')
      setPhoneCode('')
      setPhoneMessage('Code sent. Enter the 6-digit code below to confirm your phone number.')
    } catch (err) {
      console.error('Phone verification send failed', err)
      setPhoneStatus('idle')
      setPhoneMessage('Unable to send verification code. Check your phone number and try again.')
    }
  }

  const handleConfirmPhoneCode = async () => {
    if (!prospectId) {
      setError('We need your prospect ID before confirming the code. Please request a code first.')
      return
    }

    if (!formData.phone) {
      setError('Enter your phone number before confirming the code')
      return
    }

    if (!phoneCode) {
      setError('Enter the verification code sent to your phone')
      return
    }

    try {
      setError('')
      setPhoneStatus('verifying')

      const response = await fetch('/api/onboarding/verify-phone', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId, phone: formData.phone, code: phoneCode })
      })

      const data = await response.json()
      if (!response.ok || !data.verified) {
        throw new Error(data.error || 'Verification code was not accepted')
      }

      setPhoneStatus('verified')
      setPhoneMessage('Phone number verified')
    } catch (err) {
      console.error('Phone verification failed', err)
      setPhoneStatus('code_sent')
      setPhoneMessage('Verification failed. Double-check the code and try again.')
    }
  }

  const handleNext = async () => {
    setError('')

    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password || !formData.dob) {
        setError('Please fill in all required fields')
        return
      }
      const age = calculateAge(formData.dob)
      if (age < 30) {
        setError('You must be 30 years or older to use this platform')
        return
      }
    }

    if (step === 4) {
      const saved = await handleSaveCompatibility()
      if (!saved) {
        return
      }
    }

    if (step === 5) {
      if (!passkeyBypass && passkeyState !== 'verified') {
        setError('Please finish passkey setup or choose Skip for now')
        return
      }

      if (phoneStatus !== 'verified') {
        setError('Verify your phone number to continue')
        return
      }
    }

    setStep((prev) => Math.min(STEP_COUNT, prev + 1))
  }

  const handleComplete = async () => {
    setLoading(true)
    setError('')

    try {
      // Prepare user data
      const userData = {
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        name: formData.name,
        username: formData.username || '', // Optional - will auto-generate if empty
        age: calculateAge(formData.dob),
        dateOfBirth: formData.dob,
        gender: formData.gender,
        tribe: formData.tribe || '',
        city: formData.city || '',
        country: formData.country || '',
        countryOfOrigin: formData.countryOfOrigin || '',
        cityOfOrigin: formData.cityOfOrigin || '',
        maritalStatus: formData.maritalStatus || '',
        height: formData.height || '',
        education: formData.education || '',
        religion: formData.religion || '',
        lookingFor: formData.lookingFor || '',
        interests: formData.interests || [],
        profilePhoto: mediaState.id.fileUrl || '',
        selfiePhoto: mediaState.selfie.fileUrl || '',
        subscriptionPlan: selectedPlan || 'free',
        verified: false,
        prospectId,
        compatibilityScore: compatibilityResult?.overallScore ?? null,
        compatibilityPersonas: compatibilityResult?.personas?.slice(0, 2) ?? [],
        passkeyVerified: passkeyState === 'verified',
        passkeyBypass,
        phoneVerified: phoneStatus === 'verified'
      }

      console.log('Submitting signup data:', { ...userData, password: '***' })

      // Call signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      const data = await response.json()
      console.log('Signup response:', data)

      if (data.success) {
        // Store user data and token
        if (data.token) {
          sessionStorage.setItem('token', data.token)
        }
        // Redirect to unified dashboard
        router.push('/dashboard-spa')
      } else {
        setError(data.message || 'Failed to create account')
        setLoading(false)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-linear-to-br from-blue-50 via-background to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md max-h-[95vh] bg-white rounded-2xl shadow-lg overflow-y-auto">
        {/* Dark Purple Header Section */}
        <div className="bg-purple-900 px-6 py-3 sticky top-0 z-10">
          {/* Logo */}
          <div className="flex items-center justify-center">
            <img src="/triballogo.png" alt="Tribal Mingle" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
          </div>

          {/* Step Indicator */}
          <div className="flex gap-2 mt-2">
            {STEP_INDICATORS.map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition ${s <= step ? 'bg-orange-500' : 'bg-purple-700'}`} />
            ))}
          </div>
        </div>

        {/* White Form Section */}
        <div className="p-5">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-2.5">
            <h2 className="text-lg md:text-xl font-bold mb-3">Create Your Account</h2>
            
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username (Optional)</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="e.g., john1234"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to auto-generate from your name
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <p className="text-xs text-muted-foreground mt-1">Must be 30 or older</p>
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-2.5">
            <h2 className="text-lg md:text-xl font-bold mb-3">More About You</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="non-binary">Non-binary</option>
                <option value="prefer-not">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Height</label>
              <select
                name="height"
                value={formData.height}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select height...</option>
                {HEIGHTS_IN_FEET.map(height => (
                  <option key={height} value={height}>{height}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Education</label>
              <select
                name="education"
                value={formData.education}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select education...</option>
                {EDUCATION_LEVELS.map(edu => (
                  <option key={edu} value={edu}>{edu}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Marital Status</label>
              <select
                name="maritalStatus"
                value={formData.maritalStatus}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select...</option>
                {MARITAL_STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Religion</label>
              <select
                name="religion"
                value={formData.religion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select religion...</option>
                {RELIGIONS.map(religion => (
                  <option key={religion} value={religion}>{religion}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Looking For</label>
              <select
                name="lookingFor"
                value={formData.lookingFor}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select...</option>
                {LOOKING_FOR_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Location & Tribe */}
        {step === 3 && (
          <div className="space-y-2.5">
            <h2 className="text-lg md:text-xl font-bold mb-3">Location & Heritage</h2>

            <div>
              <label className="block text-sm font-medium mb-2">Current Country</label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select country...</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Current City</label>
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={!formData.country}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-100"
              >
                <option value="">Select city...</option>
                {formData.country && getCitiesForCountry(formData.country).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {!formData.country && (
                <p className="text-xs text-muted-foreground mt-1">Select country first</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Country of Origin</label>
              <select
                name="countryOfOrigin"
                value={formData.countryOfOrigin}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select origin country...</option>
                {Object.keys(AFRICAN_COUNTRIES_WITH_TRIBES).map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tribe</label>
              <select
                name="tribe"
                value={formData.tribe}
                onChange={handleChange}
                disabled={!formData.countryOfOrigin}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent disabled:bg-gray-100"
              >
                <option value="">Select tribe...</option>
                {formData.countryOfOrigin && getTribesForCountry(formData.countryOfOrigin).map(tribe => (
                  <option key={tribe} value={tribe}>{tribe}</option>
                ))}
              </select>
              {!formData.countryOfOrigin && (
                <p className="text-xs text-muted-foreground mt-1">Select country of origin first</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Interests (Select multiple)</label>
              <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-2">
                {INTERESTS_OPTIONS.map(interest => (
                  <label key={interest} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(interest)}
                      onChange={() => handleInterestToggle(interest)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{interest}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {formData.interests.length} interests
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Compatibility Quiz */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold">Compatibility signals</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Use the sliders to show how you move through faith, family, ambition, lifestyle, and service.
                We translate this into persona tags for the concierge team.
              </p>
            </div>

            <div className="space-y-4">
              {COMPATIBILITY_QUESTIONS.map(question => (
                <div key={question.id} className="rounded-2xl border border-border/70 bg-white/80 p-4 shadow-sm space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-sm md:text-base">{question.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{question.helper}</p>
                    </div>
                    <span className="text-sm font-semibold text-accent">
                      {quizAnswers[question.id] ?? DEFAULT_COMPATIBILITY_VALUE}/5
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={quizAnswers[question.id] ?? DEFAULT_COMPATIBILITY_VALUE}
                    onChange={event => handleQuizAnswerChange(question.id, Number(event.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{question.leftLabel}</span>
                    <span>{question.rightLabel}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSaveCompatibility}
              disabled={compatibilitySaving}
              className="w-full rounded-lg border border-accent bg-accent/10 px-4 py-3 text-sm font-semibold text-accent hover:bg-accent/20 transition disabled:opacity-50"
            >
              {compatibilitySaving ? 'Saving compatibility insights...' : 'Save compatibility insights'}
            </button>

            {compatibilityResult && (
              <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall alignment</p>
                    <p className="text-3xl font-bold text-accent">{compatibilityResult.overallScore}%</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {compatibilityResult.personas.slice(0, 2).map(persona => (
                      <span key={persona.id} className="rounded-full border border-accent/50 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        {persona.label} · {persona.score}%
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {compatibilityResult.dimensionScores.map(dimension => (
                    <div key={dimension.dimension}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{dimension.label}</span>
                        <span>{dimension.score}%</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-border">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${dimension.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <ul className="space-y-1 text-sm text-muted-foreground">
                  {compatibilityResult.insights.map(insight => (
                    <li key={insight} className="flex gap-2">
                      <span className="text-accent">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Secure Your Account */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold">Secure your identity</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We use passkeys and verified phone numbers to stop account takeovers before they start. Finish both to continue.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-white/80 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">Create a passkey</p>
                  <p className="text-sm text-muted-foreground">Use FaceID, TouchID, or your device security as your login secret.</p>
                </div>
                {passkeyState === 'verified' && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Verified</span>
                )}
              </div>

              {!passkeyBypass && passkeyState !== 'verified' && (
                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  disabled={!passkeyAvailable || passkeyState === 'processing'}
                  className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {passkeyState === 'processing' ? 'Waiting for device confirmation...' : 'Create passkey'}
                </button>
              )}

              {passkeyError && (
                <p className="text-xs text-red-500">{passkeyError}</p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Status:{' '}
                  {passkeyBypass
                    ? 'Skipped on this device'
                    : passkeyState === 'verified'
                      ? 'Passkey ready'
                      : passkeyState === 'processing'
                        ? 'Awaiting confirmation'
                        : passkeyState === 'error'
                          ? 'Action required'
                          : 'Not started'}
                </span>
                {!passkeyBypass && passkeyState !== 'verified' && (
                  <button type="button" onClick={handleSkipPasskey} className="text-[11px] font-semibold text-muted-foreground underline">
                    Skip for now
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border bg-white/80 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">Verify your phone</p>
                  <p className="text-sm text-muted-foreground">We use SMS for concierge handoffs and safety alerts.</p>
                </div>
                {phoneStatus === 'verified' && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Verified</span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+15555555555"
                  className="w-full rounded-lg border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <p className="text-xs text-muted-foreground">Use an E.164 formatted number (include country code).</p>
              </div>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSendPhoneCode}
                    disabled={phoneStatus === 'sending' || phoneStatus === 'verifying' || phoneStatus === 'verified'}
                    className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
                  >
                    {phoneStatus === 'sending' ? 'Sending...' : 'Send code'}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPhoneCode}
                    disabled={phoneStatus !== 'code_sent'}
                    className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {phoneStatus === 'verifying' ? 'Confirming...' : 'Confirm code'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  value={phoneCode}
                  onChange={(event) => setPhoneCode(event.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter 6-digit code"
                  className="w-full rounded-lg border border-border px-4 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  disabled={phoneStatus === 'idle' || phoneStatus === 'sending'}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Status:{' '}
                {phoneStatus === 'idle' && 'Not started'}
                {phoneStatus === 'sending' && 'Sending code...'}
                {phoneStatus === 'code_sent' && 'Code sent. Check your SMS inbox.'}
                {phoneStatus === 'verifying' && 'Confirming code...'}
                {phoneStatus === 'verified' && 'Phone number verified'}
              </p>
              {phoneMessage && <p className="text-xs text-muted-foreground">{phoneMessage}</p>}
            </div>

            <TrialUpsellCard
              context="security"
              acknowledged={trialInterest.security}
              onAction={handleTrialInterest}
            />
          </div>
        )}

        {/* Step 6: Identity Media Uploads */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold">Verify your identity</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Securely upload a government ID, capture a selfie, and record short voice/video snippets. We store everything encrypted, run AI checks, and only share with stewarded reviewers.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-border/80 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Government ID</p>
                    <p className="text-xs text-muted-foreground">Passport or driver's licence works best.</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mediaStatusConfig[mediaState.id.status].badge}`}>
                    {mediaStatusConfig[mediaState.id.status].label}
                  </span>
                </div>

                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleMediaSelection('id', event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => idInputRef.current?.click()}
                  className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                    mediaState.id.previewUrl ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
                  }`}
                >
                  {mediaState.id.previewUrl ? (
                    <div className="space-y-2">
                      <img src={mediaState.id.previewUrl} alt="Uploaded ID" className="mx-auto max-h-40 rounded-lg" />
                      <p className="text-sm text-muted-foreground">Tap to replace</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-4xl">📄</div>
                      <p className="font-semibold">Upload ID</p>
                      <p className="text-xs text-muted-foreground">PNG or JPEG up to 10 MB</p>
                    </div>
                  )}
                </button>
                {mediaState.id.message && <p className="text-xs text-muted-foreground">{mediaState.id.message}</p>}
              </div>

              <div className="space-y-3 rounded-2xl border border-border/80 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Selfie photo</p>
                    <p className="text-xs text-muted-foreground">Use good lighting so the badge clears quickly.</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mediaStatusConfig[mediaState.selfie.status].badge}`}>
                    {mediaStatusConfig[mediaState.selfie.status].label}
                  </span>
                </div>

                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(event) => handleMediaSelection('selfie', event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => selfieInputRef.current?.click()}
                  className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                    mediaState.selfie.previewUrl ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
                  }`}
                >
                  {mediaState.selfie.previewUrl ? (
                    <div className="space-y-2">
                      <img src={mediaState.selfie.previewUrl} alt="Uploaded selfie" className="mx-auto max-h-40 rounded-full object-cover" />
                      <p className="text-sm text-muted-foreground">Tap to retake</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-4xl">📸</div>
                      <p className="font-semibold">Capture selfie</p>
                      <p className="text-xs text-muted-foreground">Natural light works best</p>
                    </div>
                  )}
                </button>
                {mediaState.selfie.message && <p className="text-xs text-muted-foreground">{mediaState.selfie.message}</p>}
              </div>

              <div className="space-y-3 rounded-2xl border border-border/80 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Voice introduction</p>
                    <p className="text-xs text-muted-foreground">30-second audio so we can confirm liveness.</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mediaStatusConfig[mediaState.voice.status].badge}`}>
                    {mediaStatusConfig[mediaState.voice.status].label}
                  </span>
                </div>

                <input
                  ref={voiceInputRef}
                  type="file"
                  accept="audio/*"
                  capture={'microphone' as any}
                  className="hidden"
                  onChange={(event) => handleMediaSelection('voice', event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => voiceInputRef.current?.click()}
                  className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                    mediaState.voice.previewUrl ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
                  }`}
                >
                  {mediaState.voice.previewUrl ? (
                    <div className="space-y-2">
                      <audio controls src={mediaState.voice.previewUrl} className="w-full" />
                      <p className="text-sm text-muted-foreground">Tap to rerecord</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-4xl">🎙️</div>
                      <p className="font-semibold">Record voice</p>
                      <p className="text-xs text-muted-foreground">MP3/M4A up to 15 MB</p>
                    </div>
                  )}
                </button>
                {mediaState.voice.message && <p className="text-xs text-muted-foreground">{mediaState.voice.message}</p>}
              </div>

              <div className="space-y-3 rounded-2xl border border-border/80 bg-white/80 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Video greeting</p>
                    <p className="text-xs text-muted-foreground">15-second hello so stewards can match energy.</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mediaStatusConfig[mediaState.video.status].badge}`}>
                    {mediaStatusConfig[mediaState.video.status].label}
                  </span>
                </div>

                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  capture="user"
                  className="hidden"
                  onChange={(event) => handleMediaSelection('video', event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className={`w-full rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
                    mediaState.video.previewUrl ? 'border-accent bg-accent/5' : 'border-border hover:border-accent'
                  }`}
                >
                  {mediaState.video.previewUrl ? (
                    <div className="space-y-2">
                      <video controls src={mediaState.video.previewUrl} className="mx-auto max-h-48 rounded-lg" />
                      <p className="text-sm text-muted-foreground">Tap to reshoot</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-4xl">🎥</div>
                      <p className="font-semibold">Record video</p>
                      <p className="text-xs text-muted-foreground">MP4/MOV up to 100 MB</p>
                    </div>
                  )}
                </button>
                {mediaState.video.message && <p className="text-xs text-muted-foreground">{mediaState.video.message}</p>}
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Media uploads use expiring signed URLs and are only visible to stewarded reviewers once approved.
            </p>

            {(['id', 'selfie', 'voice', 'video'] as MediaTypeKey[]).some((key) => mediaState[key].status === 'flagged') && (
              <p className="text-xs text-amber-700 text-center bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                One or more uploads need attention. Review the cards above for specific notes and retake where necessary.
              </p>
            )}

            <TrialUpsellCard
              context="media"
              acknowledged={trialInterest.media}
              onAction={handleTrialInterest}
            />
          </div>
        )}

        {/* Step 7: Subscription Plan */}
        {step === 7 && (
          <div className="space-y-2.5">
            <h2 className="text-lg md:text-xl font-bold mb-3">Choose Your Plan</h2>

            <div className="space-y-3">
              {[
                { 
                  id: 'free', 
                  name: 'Free', 
                  price: '£0', 
                  duration: 'Forever',
                  originalPrice: null,
                  features: ['Browse profiles', 'Limited likes', 'Send messages', 'View matches'], 
                  popular: false 
                },
                { 
                  id: 'monthly', 
                  name: 'Monthly', 
                  price: '£15', 
                  duration: 'per month',
                  originalPrice: null,
                  features: ['Browse profiles', 'Unlimited likes', 'Send messages', 'View matches'], 
                  popular: false 
                },
                { 
                  id: '3months', 
                  name: '3 Months', 
                  price: '£35', 
                  duration: 'for 3 months',
                  originalPrice: '£45',
                  features: ['Browse profiles', 'Unlimited likes', 'Send messages', 'View matches'], 
                  popular: true 
                },
                { 
                  id: '6months', 
                  name: '6 Months', 
                  price: '£60', 
                  duration: 'for 6 months',
                  originalPrice: '£90',
                  features: ['Browse profiles', 'Unlimited likes', 'Send messages', 'View matches'], 
                  popular: false 
                }
              ].map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedPlan === plan.id ? 'border-accent bg-blue-50' : 'border-border hover:border-accent'
                  } ${plan.popular ? 'ring-2 ring-accent' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold">{plan.name}</h3>
                    {plan.popular && <span className="text-xs bg-accent text-accent-foreground px-2 py-1 rounded">Most Popular</span>}
                  </div>
                  <div className="mb-2">
                    <p className="text-2xl font-bold text-accent inline">{plan.price}</p>
                    {plan.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through ml-2">{plan.originalPrice}</span>
                    )}
                    <p className="text-xs text-muted-foreground">{plan.duration}</p>
                  </div>
                  <ul className="text-xs space-y-1">
                    {plan.features.map(feature => (
                      <li key={feature} className="text-muted-foreground flex items-center gap-1">
                        <span className="text-accent">✓</span> {feature}
                      </li>
                    ))}
                  </ul>
                  {selectedPlan === plan.id && (
                    <div className="mt-2 text-xs text-accent font-semibold">✓ Selected</div>
                  )}
                </div>
              ))}
            </div>

            <TrialUpsellCard
              context="plan"
              acknowledged={trialInterest.plan}
              onAction={handleTrialInterest}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => {
              setError('')
              setStep(Math.max(1, step - 1))
            }}
            disabled={step === 1 || loading || compatibilitySaving}
            className="flex-1 px-4 py-3 border border-border rounded-lg font-semibold text-foreground hover:bg-muted disabled:opacity-50 transition"
          >
            Back
          </button>
          <button
            onClick={() => {
              if (step < STEP_COUNT) {
                handleNext()
              } else {
                handleComplete()
              }
            }}
            disabled={loading || compatibilitySaving}
            className="flex-1 px-4 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : step === STEP_COUNT ? 'Complete' : 'Next'} 
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account? <Link href="/login" className="text-accent font-semibold hover:underline">Log in</Link>
        </p>
        </div>
      </div>
    </div>
  )
}
