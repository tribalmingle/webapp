'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/contexts/auth-context'
import { MemberAppShell } from '@/components/layouts/member-app-shell'
import { PremiumProfileCard, StatCard } from '@/components/premium'
import { StaggerGrid, SlideUp, FadeIn } from '@/components/motion'
import { 
  Apple,
  Heart,
  Users,
  Sparkles,
  Star,
  MessageCircle,
  Zap,
  Crown,
  CheckCircle,
  Clock,
  Eye,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  Smile,
  Send,
  Check,
  Copy,
  User as UserIcon,
  Bell,
  Lock,
  LogOut,
  MapPin,
  Briefcase,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  WalletCards,
  Gift,
  Share2,
  HelpCircle,
  ShieldCheck,
  Filter
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  AFRICAN_COUNTRIES_WITH_TRIBES,
  COUNTRIES,
  CITIES_BY_COUNTRY,
  getTribesForCountry,
  getCitiesForCountry,
  HEIGHTS_IN_FEET,
  EDUCATION_LEVELS,
  RELIGIONS,
  LOOKING_FOR_OPTIONS,
  INTERESTS_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  WORK_TYPES
} from '@/lib/constants/profile-options'
interface LikeData {
  _id: string
  userId: string
  name: string
  age: number
  city: string
  tribe: string
  profilePhoto: string
  likedAt: string
}

interface ViewData extends LikeData {
  viewedAt: string
  duration: number
}

interface Message {
  _id: string
  senderId: string
  receiverId: string
  message: string
  createdAt: string
}

interface ChatUser {
  email: string
  name: string
  username?: string
  age: number
  city: string
  profilePhoto: string
}

type ActiveView = 'home' | 'discover' | 'safety' | 'profile' | 'likes' | 'chat' | 'chat-conversation' | 'subscription' | 'settings' | 'profile-view' | 'referrals' | 'spotlight'
type SpaNavKey = 'home' | 'likes' | 'chat' | 'profile' | 'subscription' | 'settings' | 'referrals' | 'spotlight'

const SPA_NAV_ITEMS: Array<{ id: SpaNavKey; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'likes', label: 'Likes' },
  { id: 'chat', label: 'Chat' },
  { id: 'profile', label: 'Profile' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'settings', label: 'Settings' },
]

interface Testimonial {
  _id: string
  name: string
  age?: number
  city?: string
  country?: string
  tribe?: string
  profilePhoto?: string
  rating: number
  content: string
  sourceType: 'user' | 'admin'
}

type BoostPlacement = 'spotlight' | 'travel' | 'event'
type BoostLocale = 'africa_west' | 'africa_east' | 'diaspora_eu' | 'diaspora_na'

interface BoostBidRecord {
  sessionId: string
  status: string
  bidAmountCredits: number
  auctionWindowStart: string | null
  boostStartsAt: string | null
  boostEndsAt: string | null
  autoRollover: boolean
  createdAt: string | null
  updatedAt: string | null
}

interface BoostSummary {
  success: boolean
  window: {
    locale: string
    placement: string
    windowStart: string
    boostStartsAt: string
    boostEndsAt: string
    minBidCredits: number
    maxWinners: number
  }
  nextWindow: {
    windowStart: string
    boostStartsAt: string
    boostEndsAt: string
  }
  credits: {
    available: number
    minBidCredits: number
    suggestedBidCredits: number
  }
  bids: {
    pending: BoostBidRecord | null
    nextPending: BoostBidRecord | null
    active: BoostBidRecord[]
    history: BoostBidRecord[]
  }
}

const BOOST_LOCALE_OPTIONS: { value: BoostLocale; label: string }[] = [
  { value: 'africa_west', label: 'West Africa' },
  { value: 'africa_east', label: 'East Africa' },
  { value: 'diaspora_eu', label: 'Diaspora EU' },
  { value: 'diaspora_na', label: 'Diaspora NA' }
]

const BOOST_PLACEMENT_OPTIONS: { value: BoostPlacement; label: string }[] = [
  { value: 'spotlight', label: 'Spotlight' },
  { value: 'travel', label: 'Travel' },
  { value: 'event', label: 'Event' }
]

type WalletProvider = 'apple_pay' | 'google_pay'

interface WalletProviderOption {
  enabled: boolean
  merchantId?: string
  merchantName?: string
  merchantCapabilities: string[]
  supportedNetworks: string[]
  countryCode?: string
  currencyCode?: string
  gateway?: string
  environment: 'test' | 'production'
  minOSVersion?: string
}

interface WalletOptionsResponse {
  region: string
  currency: string
  countryCode: string
  fallbackProvider: 'stripe' | 'paystack'
  wallets: Record<WalletProvider, WalletProviderOption>
}

type ReferralTierInfo = {
  key: string
  label: string
  minSuccessful: number
  memberReward: string
  guardianReward: string | null
}

interface ReferralProgressData {
  referralCode: string | null
  shareUrl: string | null
  tier: ReferralTierInfo
  tiers: Array<ReferralTierInfo & { attained: boolean }>
  nextTier: (ReferralTierInfo & { remaining: number }) | null
  counts: {
    totalInvitees: number
    pending: number
    successful: number
    rewarded: number
    rolling90dCount: number
  }
  rollingWindow: {
    start: string
    days: number
  }
  rewards: {
    memberReward: string
    guardianReward: string | null
    payoutsIssued: number
    lastRewardIssuedAt: string | null
  }
}

type SubscriptionPlanId = 'free' | 'monthly' | '3-months' | '6-months'
type PaidSubscriptionPlanId = Exclude<SubscriptionPlanId, 'free'>

interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  price: string
  period: string
  icon: LucideIcon
  gradient: string
  features: string[]
  popular?: boolean
}

const WALLET_PROVIDER_META: Record<WalletProvider, { label: string; icon: LucideIcon }> = {
  apple_pay: { label: 'Apple Pay', icon: Apple },
  google_pay: { label: 'Google Pay', icon: WalletCards },
}
export default function UnifiedDashboard() {
  const { user, logout, updateUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])
  
  // Initialize activeView from URL search param
  const initialView = useMemo(() => {
    const viewParam = searchParams.get('view')
    const validViews: ActiveView[] = ['home', 'discover', 'safety', 'profile', 'likes', 'chat', 'subscription', 'settings', 'referrals', 'spotlight', 'chat-conversation', 'profile-view']
    if (viewParam && validViews.includes(viewParam as ActiveView)) {
      return viewParam as ActiveView
    }
    return 'home'
  }, [searchParams])
  
  // Navigation
  const [activeView, setActiveView] = useState<ActiveView>(initialView)
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null)
  
  // Profile state
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<any>({})
  const [profileMessage, setProfileMessage] = useState('')
  
  // Likes state
  const [activeTab, setActiveTab] = useState<'liked' | 'likedMe' | 'views'>('likedMe')
  const [peopleILiked, setPeopleILiked] = useState<LikeData[]>([])
  const [peopleWhoLikedMe, setPeopleWhoLikedMe] = useState<LikeData[]>([])
  const [profileViews, setProfileViews] = useState<ViewData[]>([])
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [chatUser, setChatUser] = useState<ChatUser | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [conversations, setConversations] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [freeMessageLimitReached, setFreeMessageLimitReached] = useState(false)
  
  // Discover People state
  const [discoverUsers, setDiscoverUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [advancedFilters, setAdvancedFilters] = useState({
    maritalStatus: 'i-dont-mind',
    minAge: '',
    maxAge: '',
    country: 'i-dont-mind',
    city: 'i-dont-mind',
    tribe: 'i-dont-mind',
    religion: 'i-dont-mind',
    education: 'i-dont-mind',
    workType: 'i-dont-mind'
  })
  const [todayMatches, setTodayMatches] = useState<any[]>([])
  const [selectedProfile, setSelectedProfile] = useState<any>(null)

  // Basic & advanced search state
  const basicSearchRef = useRef<HTMLDivElement | null>(null)
  const [basicMinAge, setBasicMinAge] = useState<number | ''>(30)
  const [basicMaxAge, setBasicMaxAge] = useState<number | ''>(45)
  const [basicTribe, setBasicTribe] = useState<string>('i-dont-mind')
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)

  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [showTestimonialPrompt, setShowTestimonialPrompt] = useState(false)
  const [testimonialContent, setTestimonialContent] = useState('')
  const [testimonialRating, setTestimonialRating] = useState(5)
  
  // Dashboard Stats state
  const [dashboardStats, setDashboardStats] = useState({
    likes: 0,
    messages: 0,
    views: 0,
    matches: 0
  })
  
  // Photo gallery state
  const [showPhotoGallery, setShowPhotoGallery] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([])

  // Boost auction state
  const [boostSummary, setBoostSummary] = useState<BoostSummary | null>(null)
  const [boostLocale, setBoostLocale] = useState<BoostLocale>('africa_west')
  const [boostPlacement, setBoostPlacement] = useState<BoostPlacement>('spotlight')
  const [boostLoading, setBoostLoading] = useState(false)
  const [boostSubmitting, setBoostSubmitting] = useState(false)
  const [boostError, setBoostError] = useState<string | null>(null)
  const [boostBidAmount, setBoostBidAmount] = useState<number | ''>('')
  const [boostAutoRollover, setBoostAutoRollover] = useState(false)

  // Wallet checkout state
  const [walletOptions, setWalletOptions] = useState<WalletOptionsResponse | null>(null)
  const [walletOptionsLoading, setWalletOptionsLoading] = useState(false)
  const [walletOptionsError, setWalletOptionsError] = useState<string | null>(null)
  const [walletCheckoutState, setWalletCheckoutState] = useState<{ provider: WalletProvider | null; planId: PaidSubscriptionPlanId | null }>({
    provider: null,
    planId: null,
  })

  // Referral tiers state
  const [referralProgress, setReferralProgress] = useState<ReferralProgressData | null>(null)
  const [referralLoading, setReferralLoading] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
  const [referralCopiedField, setReferralCopiedField] = useState<'code' | 'link' | null>(null)
  const [showReferralInvite, setShowReferralInvite] = useState(false)
  const [referralInviteSubmitting, setReferralInviteSubmitting] = useState(false)
  const [referralInviteForm, setReferralInviteForm] = useState({
    inviteeEmail: '',
    inviteeName: '',
    guardianEmail: '',
    message: '',
  })
  const [referralInviteError, setReferralInviteError] = useState<string | null>(null)
  
  // Rotating messages for premium users
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const inspirationalMessages = [
    { title: "Find love within your tribe", subtitle: "Your life partner is just a chat away - initiate that chat now and see miracles happen" },
    { title: "Connections that matter", subtitle: "Build meaningful relationships with people who share your values and heritage" },
    { title: "Your perfect match awaits", subtitle: "Discover someone special who understands your culture and traditions" },
    { title: "Love knows no distance", subtitle: "Connect with amazing people from your tribe around the world" },
    { title: "Start your love story today", subtitle: "Every great relationship starts with a simple hello - send yours now" }
  ]

  const walletRegionHint = useMemo(() => computeWalletRegion(user), [user])
  
  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowMessages: true
  })
  
  const [loading, setLoading] = useState(false)
  const [globalMessage, setGlobalMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  const emojis = ['😊', '😂', '❤️', '👍', '🙏', '😍', '🔥', '✨', '🎉', '💯', '👏', '🤔', '😎', '💪', '🌟', '💕']

  // Load testimonials for free users and prompt state for paid users
  useEffect(() => {
    if (!user) return

    const plan = user.subscriptionPlan || 'free'

    // Free users see testimonials on dashboard
    if (!plan || plan === 'free') {
      fetch('/api/testimonials?limit=6', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data?.success && Array.isArray(data.testimonials)) {
            setTestimonials(data.testimonials)
          }
        })
        .catch(err => {
          console.error('Error fetching testimonials:', err)
        })
    }

    // Paid users may be prompted to submit testimonial
    if (plan && plan !== 'free') {
      fetch('/api/testimonials/prompt-state', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data?.success && data.showPrompt) {
            setShowTestimonialPrompt(true)
          }
        })
        .catch(err => {
          console.error('Error fetching testimonial prompt state:', err)
        })
    }
  }, [user])

  const handleDismissTestimonialPrompt = async () => {
    setShowTestimonialPrompt(false)
    try {
      await fetch('/api/testimonials/prompt-state', { method: 'POST', credentials: 'include' })
    } catch (error) {
      console.error('Error updating testimonial prompt state:', error)
    }
  }

  const handleSubmitTestimonial = async () => {
    if (!testimonialContent.trim()) {
      setGlobalMessage({ type: 'error', text: 'Please share a few words about your Tribal Mingle experience.' })
      return
    }

    try {
      const res = await fetch('/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          content: testimonialContent.trim(),
          rating: testimonialRating
        })
      })

      const data = await res.json()
      if (data.success) {
        setShowTestimonialPrompt(false)
        setTestimonialContent('')
        setTestimonialRating(5)
        setGlobalMessage({ type: 'success', text: 'Thank you for sharing your story with our tribe community. Our team will review it shortly.' })
      } else {
        setGlobalMessage({ type: 'error', text: data.message || 'Failed to submit testimonial' })
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      setGlobalMessage({ type: 'error', text: 'Failed to submit testimonial' })
    }
  }

  // Rotate inspirational messages every 30 seconds for premium users
  useEffect(() => {
    if (user?.subscriptionPlan && user.subscriptionPlan !== 'free') {
      const interval = setInterval(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % inspirationalMessages.length)
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [user])


  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        dateOfBirth: user.dateOfBirth || '',
        bio: user.bio || '',
        gender: user.gender || '',
        tribe: user.tribe || '',
        country: user.country || '',
        city: user.city || '',
        countryOfOrigin: user.countryOfOrigin || '',
        cityOfOrigin: user.cityOfOrigin || '',
        maritalStatus: user.maritalStatus || '',
        height: user.height || '',
        bodyType: user.bodyType || '',
        education: user.education || '',
  occupation: user.occupation || '',
  workType: (user as any).workType || '',
        religion: user.religion || '',
        lookingFor: user.lookingFor || '',
        interests: (() => {
          const interests = (user as any).interests
          return Array.isArray(interests) ? interests : (interests && typeof interests === 'string' ? interests.split(', ') : [])
        })(),
        profilePhotos: user.profilePhotos || []
      })
    }
  }, [user])

  // Fetch today's matches and discover users
  useEffect(() => {
    if (activeView === 'home' && user) {
      fetchTodayMatches()
      fetchDiscoverUsers()
      fetchDashboardStats()
    }
  }, [activeView, user])

  useEffect(() => {
    if (activeView !== 'home' || !user) return
    loadBoostSummary()
  }, [activeView, user, boostLocale, boostPlacement])

  // Fetch conversations
  useEffect(() => {
    if (activeView === 'chat' && user) {
      fetchConversations()
    }
  }, [activeView, user])

  // Fetch likes data
  useEffect(() => {
    if (activeView === 'likes' && user) {
      fetchLikesData()
    }
  }, [activeView, user])

  // Fetch chat messages
  useEffect(() => {
    if (activeView === 'chat-conversation' && selectedChatUser) {
      fetchChatUser(selectedChatUser)
      fetchMessages(selectedChatUser)
      const interval = setInterval(() => fetchMessages(selectedChatUser), 3000)
      return () => clearInterval(interval)
    }
  }, [activeView, selectedChatUser])

  // Auto-scroll chat
  useEffect(() => {
    if (activeView === 'chat-conversation') {
      scrollToBottom()
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', { credentials: 'include' })
      const data = await response.json()
      if (data.success) {
        setDashboardStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const loadWalletOptions = useCallback(async () => {
    if (!user) return
    setWalletOptionsLoading(true)
    setWalletOptionsError(null)
    try {
      const params = walletRegionHint ? `?region=${encodeURIComponent(walletRegionHint)}` : ''
      const response = await fetch(`/api/payments/wallet-options${params}`)
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load wallet options')
      }
      setWalletOptions(data.options)
    } catch (error) {
      console.error('Error loading wallet options:', error)
      setWalletOptions(null)
      setWalletOptionsError(error instanceof Error ? error.message : 'Unable to load wallet options')
    } finally {
      setWalletOptionsLoading(false)
    }
  }, [user, walletRegionHint])

  useEffect(() => {
    loadWalletOptions()
  }, [loadWalletOptions])

  const loadReferralProgress = useCallback(async () => {
    if (!user) return
    setReferralLoading(true)
    setReferralError(null)
    try {
      const response = await fetch('/api/referrals/progress', { credentials: 'include' })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load referral progress')
      }
      setReferralProgress(data)
    } catch (error) {
      console.error('Error loading referral progress:', error)
      setReferralProgress(null)
      setReferralError(error instanceof Error ? error.message : 'Unable to load referral progress')
    } finally {
      setReferralLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (activeView !== 'home') return
    loadReferralProgress()
  }, [activeView, loadReferralProgress])

  const loadBoostSummary = async () => {
    if (!user) return
    setBoostLoading(true)
    setBoostError(null)
    try {
      const response = await fetch(`/api/boosts/window?locale=${boostLocale}&placement=${boostPlacement}`)
      const data: BoostSummary = await response.json()

      if (!response.ok || !data.success) {
        const errorMessage = (data as any)?.error || 'Unable to load boost auction data'
        // Silently handle "Auction disabled for locale" - this is expected behavior
        if (errorMessage === 'Auction disabled for locale') {
          setBoostSummary(null)
          setBoostLoading(false)
          return
        }
        throw new Error(errorMessage)
      }

      setBoostSummary(data)
      setBoostAutoRollover(Boolean(data.bids.pending?.autoRollover))
      setBoostBidAmount((current) => {
        if (typeof current === 'number' && current >= data.credits.minBidCredits) {
          return current
        }
        return data.bids.pending?.bidAmountCredits ?? data.credits.suggestedBidCredits ?? data.credits.minBidCredits
      })
    } catch (error) {
      console.error('Error loading boost summary:', error)
      setBoostSummary(null)
      setBoostError(error instanceof Error ? error.message : 'Unable to load boost auction data')
    } finally {
      setBoostLoading(false)
    }
  }

  const handleBoostBidSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!boostSummary) {
      setBoostError('Boost details are still loading. Please try again in a moment.')
      return
    }

    const minBid = boostSummary.credits.minBidCredits
    const numericAmount = typeof boostBidAmount === 'number' ? boostBidAmount : Number(boostBidAmount)

    if (!numericAmount || Number.isNaN(numericAmount) || numericAmount < minBid) {
      setBoostError(`Bid must be at least ${minBid} credits`)
      return
    }

    setBoostSubmitting(true)
    setBoostError(null)

    try {
      const response = await fetch('/api/boosts/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          placement: boostPlacement,
          locale: boostLocale,
          bidAmountCredits: numericAmount,
          autoRollover: boostAutoRollover,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to place boost bid')
      }

      setGlobalMessage({ type: 'success', text: 'Your boost bid is locked in for the next window.' })
      await loadBoostSummary()
    } catch (error) {
      console.error('Error submitting boost bid:', error)
      setBoostError(error instanceof Error ? error.message : 'Unable to place boost bid')
    } finally {
      setBoostSubmitting(false)
    }
  }

  const fetchTodayMatches = async () => {
    try {
      const response = await fetch(`/api/matches/today`)
      const data = await response.json()
      if (data.success) {
        setTodayMatches(data.matches)
      }
    } catch (error) {
      console.error('Error fetching today\'s matches:', error)
    }
  }

  const fetchDiscoverUsers = async () => {
    try {
      const params = new URLSearchParams()

      if (searchQuery) {
        params.set('search', searchQuery)
      }

      if (advancedFilters.maritalStatus && advancedFilters.maritalStatus !== 'i-dont-mind') {
        params.set('maritalStatus', advancedFilters.maritalStatus)
      }

      if (advancedFilters.minAge) {
        params.set('minAge', advancedFilters.minAge)
      }

      if (advancedFilters.maxAge) {
        params.set('maxAge', advancedFilters.maxAge)
      }

      if (advancedFilters.country && advancedFilters.country !== 'i-dont-mind') {
        params.set('country', advancedFilters.country)
      }

      if (advancedFilters.city && advancedFilters.city !== 'i-dont-mind') {
        params.set('city', advancedFilters.city)
      }

      if (advancedFilters.tribe && advancedFilters.tribe !== 'i-dont-mind') {
        params.set('tribe', advancedFilters.tribe)
      }

      if (advancedFilters.religion && advancedFilters.religion !== 'i-dont-mind') {
        params.set('religion', advancedFilters.religion)
      }

      if (advancedFilters.education && advancedFilters.education !== 'i-dont-mind') {
        params.set('education', advancedFilters.education)
      }
      if (advancedFilters.workType && advancedFilters.workType !== 'i-dont-mind') {
        params.set('workType', advancedFilters.workType)
      }

      const queryString = params.toString()
      const url = queryString ? `/api/users/discover?${queryString}` : `/api/users/discover`

      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setDiscoverUsers(data.users)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations', { credentials: 'include' })
      const data = await response.json()
      if (data.success) {
        setConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const fetchLikesData = async () => {
    setLoading(true)
    try {
      const [likedRes, likedMeRes, viewsRes] = await Promise.all([
        fetch('/api/likes/i-liked', { credentials: 'include' }),
        fetch('/api/likes/liked-me', { credentials: 'include' }),
        fetch('/api/profile/views', { credentials: 'include' })
      ])
      
      const [likedData, likedMeData, viewsData] = await Promise.all([
        likedRes.json(),
        likedMeRes.json(),
        viewsRes.json()
      ])
      
      if (likedData.success) setPeopleILiked(likedData.likes)
      if (likedMeData.success) setPeopleWhoLikedMe(likedMeData.likes)
      if (viewsData.success) setProfileViews(viewsData.views)
    } catch (error) {
      console.error('Error fetching likes:', error)
    } finally {
      setLoading(false)
    }
  }

  const isUserLiked = (userEmail: string) => {
    return peopleILiked.some(person => person.userId === userEmail)
  }

  const trackProfileView = async (viewedUserId: string) => {
    try {
      await fetch('/api/profile/views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          viewedUserId: viewedUserId,
          duration: 5 // Initial view duration in seconds
        })
      })
    } catch (error) {
      console.error('Error tracking profile view:', error)
    }
  }

  const fetchChatUser = async (userId: string) => {
    try {
      const url = `/api/users/${userId}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setChatUser(data.user)
      } else {
        console.error('Failed to fetch chat user:', data.message)
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      const url = `/api/messages/${userId}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setMessages(data.messages)
        // For free users, enforce "only one message you sent per user" rule
        if (user?.email && (!user.subscriptionPlan || user.subscriptionPlan === 'free')) {
          const sentMessages = data.messages.filter((m: Message) => m.senderId === user.email)
          setFreeMessageLimitReached(sentMessages.length >= 1)
        } else {
          setFreeMessageLimitReached(false)
        }
      } else {
        console.error('Failed to fetch messages:', data.message)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChatUser || loading) return

    // Freemium rule: free users can only send ONE message per other user
    if (!user?.subscriptionPlan || user.subscriptionPlan === 'free') {
      if (freeMessageLimitReached) {
        setGlobalMessage({
          type: 'info',
          text: 'As a free member you can only send one message per person. Upgrade to continue this conversation.'
        })
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: selectedChatUser,
          message: newMessage.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setNewMessage('')
        fetchMessages(selectedChatUser)
      } else {
        setGlobalMessage({
          type: 'error',
          text: data.message || 'Failed to send message'
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setGlobalMessage({
        type: 'error',
        text: 'Failed to send message'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach(file => {
      if (formData.profilePhotos.length >= 10) {
        setProfileMessage('Maximum 10 photos allowed')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev: any) => ({
          ...prev,
          profilePhotos: [...prev.profilePhotos, reader.result as string]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const renderBoostSection = () => {
    const bids = boostSummary?.bids
    return (
      <section className="rounded-2xl border border-border/60 bg-white/70 p-5 shadow-sm dark:bg-slate-900/40 dark:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Boost spotlight</p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Jump to the top of discovery</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">Bid credits to claim the next spotlight slot in your region.</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-slate-500">Credits available</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">
              {boostSummary ? boostSummary.credits.available : '—'}
            </p>
            <button
              type="button"
              onClick={loadBoostSummary}
              className="mt-1 text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              Refresh status
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex flex-col text-sm font-medium text-slate-700 dark:text-slate-200">
            Locale
            <select
              value={boostLocale}
              onChange={(event) => setBoostLocale(event.target.value as BoostLocale)}
              className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950"
            >
              {BOOST_LOCALE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium text-slate-700 dark:text-slate-200">
            Placement
            <select
              value={boostPlacement}
              onChange={(event) => setBoostPlacement(event.target.value as BoostPlacement)}
              className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950"
            >
              {BOOST_PLACEMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {boostLoading && <span className="self-end text-xs text-slate-500">Refreshing window data…</span>}
        </div>

        {boostError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {boostError}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Current window</span>
                <span className="text-slate-500">Min {boostSummary?.window.minBidCredits ?? '—'} credits</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {boostSummary
                  ? (
                      <>
                        Boost runs {formatBoostDateTime(boostSummary.window.boostStartsAt)} → {safeFormatTime(boostSummary.window.boostEndsAt)}
                      </>
                    )
                  : 'Window timing details load as soon as the auction settings are ready.'}
              </p>
              {bids?.pending ? (
                <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
                  <p className="font-semibold">{bids.pending.bidAmountCredits} credits locked in</p>
                  <p className="text-xs">{bids.pending.autoRollover ? 'Auto-rollover is on' : 'Single window bid'}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">You have not placed a bid for this window yet.</p>
              )}
              {bids?.nextPending && (
                <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50/80 px-3 py-2 text-sm text-indigo-900 dark:border-indigo-400/40 dark:bg-indigo-500/10 dark:text-indigo-200">
                  <p className="font-semibold">Next window bid: {bids.nextPending.bidAmountCredits} credits</p>
                  <p className="text-xs">Bidding for {formatBoostDateTime(bids.nextPending.boostStartsAt)}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-800 dark:text-slate-100">Active boosts</span>
                <span className="text-slate-500">{bids?.active.length ?? 0}</span>
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {bids?.active.length ? (
                  bids.active.map((bid) => (
                    <li key={bid.sessionId} className="rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 dark:border-emerald-400/30 dark:bg-emerald-500/10">
                      <p className="flex items-center justify-between text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                        {bid.bidAmountCredits} credits
                        <span className="text-xs italic">Ends {safeFormatTime(bid.boostEndsAt)}</span>
                      </p>
                      <p className="text-xs text-emerald-800 dark:text-emerald-200/80">Started {formatBoostDateTime(bid.boostStartsAt)}</p>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500">No boosts running right now.</li>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Recent bid history</p>
              <ul className="mt-3 space-y-2 text-sm">
                {bids?.history.length ? (
                  bids.history.slice(0, 4).map((bid) => (
                    <li key={bid.sessionId} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-200">{bid.bidAmountCredits} credits</p>
                        <p className="text-xs text-slate-500">{formatBoostDateTime(bid.boostStartsAt)}</p>
                      </div>
                      <span className={`text-xs font-semibold ${getBoostStatusColor(bid.status)}`}>{bid.status}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-slate-500">No bids yet. Your history will appear here after your first auction.</li>
                )}
              </ul>
            </div>
          </div>

          <form onSubmit={handleBoostBidSubmit} className="rounded-2xl border border-slate-200/80 bg-linear-to-b from-white to-amber-50/60 p-5 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">Place a bid</p>
            <p className="text-sm text-slate-500">Top {boostSummary?.window.maxWinners ?? 0} bidders secure the spotlight.</p>

            <label className="mt-6 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Bid amount (credits)
              <input
                type="number"
                min={boostSummary?.credits.minBidCredits ?? 1}
                value={boostBidAmount}
                onChange={(event) => setBoostBidAmount(event.target.value ? Number(event.target.value) : '')}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-semibold text-slate-900 shadow-sm outline-none focus:border-amber-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
              <span className="mt-1 block text-xs text-slate-500">Minimum {boostSummary?.credits.minBidCredits ?? 0} credits</span>
            </label>

            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={boostAutoRollover}
                onChange={(event) => setBoostAutoRollover(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              Auto-rollover losing bids into the next window
            </label>

            <button
              type="submit"
              disabled={boostSubmitting || boostLoading}
              className="mt-6 w-full rounded-xl bg-amber-600 px-4 py-3 text-center text-base font-semibold text-white shadow hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-amber-400"
            >
              {boostSubmitting ? 'Submitting bid…' : 'Submit bid'}
            </button>
            <p className="mt-3 text-xs text-slate-500">
              Bids are only debited if you win the window. Credits return automatically if you lose and auto-rollover is off.
            </p>
          </form>
        </div>
      </section>
    )
  }

  const renderReferralSection = () => {
    const counts = referralProgress?.counts
    const tiers = referralProgress?.tiers ?? []
    const nextTier = referralProgress?.nextTier ?? null
    const rollingWindowDays = referralProgress?.rollingWindow.days ?? 90
    const rollingWindowStart = referralProgress?.rollingWindow.start
    const rollingWindowLabel = rollingWindowStart
      ? `Rolling ${rollingWindowDays}-day window since ${new Date(rollingWindowStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : `Rolling ${rollingWindowDays}-day window`

    const tierStats = [
      { label: 'Pending invites', value: counts?.pending ?? 0 },
      { label: 'Successful', value: counts?.successful ?? 0 },
      { label: 'Rewarded', value: counts?.rewarded ?? 0 },
      { label: 'Total sent', value: counts?.totalInvitees ?? 0 },
    ]

    return (
      <section className="rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-sm dark:border-emerald-500/20 dark:bg-slate-900/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Referral tiers</p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Grow the tribe, unlock rewards</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{rollingWindowLabel}. Earn better rewards as more of your invites join.</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase text-slate-500">Successful invites ({rollingWindowDays}d)</p>
            <p className="text-3xl font-semibold text-slate-900 dark:text-white">{counts ? counts.rolling90dCount : referralLoading ? '…' : '—'}</p>
            <button
              type="button"
              onClick={loadReferralProgress}
              className="mt-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Refresh progress
            </button>
          </div>
        </div>

        {referralError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
            {referralError}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Your referral code</p>
                  <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tracking-wide">
                    {referralProgress?.referralCode ?? (referralLoading ? 'Generating…' : '—')}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={!referralProgress?.referralCode}
                  onClick={() => copyReferralValue(referralProgress?.referralCode ?? null, 'code')}
                >
                  {referralCopiedField === 'code' ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                  {referralCopiedField === 'code' ? 'Copied' : 'Copy code'}
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Share link</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={!referralProgress?.shareUrl}
                      onClick={() => copyReferralValue(referralProgress?.shareUrl ?? null, 'link')}
                      className="h-8 text-xs"
                    >
                      {referralCopiedField === 'link' ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                      {referralCopiedField === 'link' ? 'Link copied' : 'Copy link'}
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 break-all">
                    {referralProgress?.shareUrl ?? 'Share link will appear once your referral code finishes provisioning.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setShowReferralInvite(true)}>
                    <Gift className="mr-2 h-4 w-4" /> Invite from contacts
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (!referralProgress?.shareUrl) return
                      if (typeof window !== 'undefined') {
                        window.open(referralProgress.shareUrl, '_blank')
                      }
                    }}
                    disabled={!referralProgress?.shareUrl}
                  >
                    <Users className="mr-2 h-4 w-4" /> Preview landing page
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Invite status</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {tierStats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-slate-700 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
                    <p className="text-xl font-semibold text-slate-900 dark:text-white">{stat.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-500">Rolling count resets automatically; keep momentum within the current window.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200/80 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-100">Tier ladder</span>
                {referralLoading && <span className="text-xs text-slate-500">Refreshing…</span>}
              </div>
              <ul className="mt-4 space-y-3">
                {tiers.length ? (
                  tiers.map((tier) => (
                    <li
                      key={tier.key}
                      className={`rounded-lg border px-3 py-3 text-sm ${tier.attained ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950/40'}`}
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{tier.label}</p>
                          <p className="text-xs text-slate-500">Requires {tier.minSuccessful} successful invites</p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tier.attained ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                          {tier.attained ? 'Unlocked' : 'Locked'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Reward: {tier.memberReward}</p>
                      {tier.guardianReward && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">Guardian perk: {tier.guardianReward}</p>
                      )}
                    </li>
                  ))
                ) : (
                  <li className="rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500">Invite friends to reveal tier progress.</li>
                )}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-linear-to-b from-white to-emerald-50/70 p-4 dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/60">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Next milestone</p>
              {nextTier ? (
                <>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{nextTier.label} tier</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Invite {nextTier.remaining} more successful member{nextTier.remaining === 1 ? '' : 's'} to unlock.</p>
                  <p className="mt-2 text-xs text-slate-500">Member reward: {nextTier.memberReward}</p>
                  {nextTier.guardianReward && (
                    <p className="text-xs text-slate-500">Guardian perk: {nextTier.guardianReward}</p>
                  )}
                </>
              ) : (
                <>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">You are at the top tier</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Our team will reach out when we launch new referral milestones. Keep inviting to earn bonuses.</p>
                </>
              )}
              <div className="mt-4 rounded-lg border border-emerald-200 bg-white/80 px-3 py-2 text-xs text-slate-600 dark:border-emerald-500/30 dark:bg-slate-900/60 dark:text-slate-300">
                <p className="font-semibold text-slate-700 dark:text-slate-200">Recent rewards</p>
                <p>Reward issued: {referralProgress?.rewards.memberReward ?? 'Pending'}</p>
                <p>Payouts issued: {referralProgress?.rewards.payoutsIssued ?? 0}</p>
                <p>Last reward: {referralProgress?.rewards.lastRewardIssuedAt ? formatDate(referralProgress.rewards.lastRewardIssuedAt) : 'Not yet awarded'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const removePhoto = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      profilePhotos: prev.profilePhotos.filter((_: any, i: number) => i !== index)
    }))
  }

  const handleInterestToggle = (interest: string) => {
    setFormData((prev: any) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i: string) => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleProfileFieldChange = (field: string, value: string) => {
    setFormData((prev: any) => {
      const updated: any = { ...prev, [field]: value }
      // Reset dependent fields
      if (field === 'country') {
        updated.city = ''
      }
      if (field === 'countryOfOrigin') {
        updated.tribe = ''
      }
      return updated
    })
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setProfileMessage('')
    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          interests: Array.isArray(formData.interests) ? formData.interests : formData.interests.split(',').map((i: string) => i.trim()).filter(Boolean)
        })
      })

      const data = await response.json()
      if (data.success) {
        updateUser(data.user)
        setProfileMessage('Profile updated successfully!')
        setIsEditing(false)
        setTimeout(() => setProfileMessage(''), 3000)
      }
    } catch (error) {
      setProfileMessage('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: SubscriptionPlanId) => {
    setLoading(true)
    try {
      const response = await fetch('/api/subscription/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: planId })
      })

      const data = await response.json()
      if (data.success) {
        updateUser(data.user)
        setGlobalMessage({
          type: 'success',
          text: 'Subscription updated successfully!'
        })
      }
    } catch (error) {
      setGlobalMessage({
        type: 'error',
        text: 'Failed to update subscription'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleWalletCheckout = useCallback(
    async (provider: WalletProvider, planId: PaidSubscriptionPlanId) => {
      setWalletCheckoutState({ provider, planId })
      setGlobalMessage(null)
      try {
        const response = await fetch('/api/payments/wallet-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            planId,
            walletProvider: provider,
            region: walletOptions?.region ?? walletRegionHint ?? undefined,
          }),
        })

        const data = await response.json()
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to start wallet checkout')
        }

        setGlobalMessage({
          type: 'success',
          text: `${WALLET_PROVIDER_META[provider].label} intent created. Complete the native sheet to finish upgrading.`,
        })
      } catch (error) {
        console.error('Wallet checkout failed:', error)
        setGlobalMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Unable to launch wallet checkout',
        })
      } finally {
        setWalletCheckoutState({ provider: null, planId: null })
      }
    },
    [walletOptions?.region, walletRegionHint],
  )

  const isWalletCheckoutPending = (provider: WalletProvider, planId: PaidSubscriptionPlanId) =>
    walletCheckoutState.provider === provider && walletCheckoutState.planId === planId

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout()
      router.push('/login')
    }
  }

  const handleUnlike = async (userId: string) => {
    try {
      const response = await fetch('/api/likes/unlike', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setPeopleILiked(prev => prev.filter(p => p.userId !== userId))
      }
    } catch (error) {
      console.error('Error unliking:', error)
    }
  }

  const handleLikeBack = async (userId: string) => {
    try {
      const response = await fetch('/api/likes/like', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ userId })
      })

      const data = await response.json()
      if (data.success) {
        setGlobalMessage({
          type: 'success',
          text: 'Liked back!'
        })
        fetchLikesData()
        fetchTodayMatches()
        fetchDiscoverUsers()
      } else {
        setGlobalMessage({
          type: 'error',
          text: data.message || 'Failed to like'
        })
      }
    } catch (error) {
      console.error('Error liking back:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h`
  }

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatBoostDateTime = (value: string | null) => {
    if (!value) return 'TBD'
    return `${formatDate(value)} · ${formatTime(value)}`
  }

  const safeFormatTime = (value: string | null | undefined) => {
    if (!value) return 'TBD'
    return formatTime(value)
  }

  const getBoostStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-emerald-600'
      case 'pending':
        return 'text-amber-600'
      case 'refunded':
      case 'expired':
        return 'text-slate-500'
      case 'cleared':
        return 'text-indigo-600'
      default:
        return 'text-slate-600'
    }
  }

  const openChat = (userId: string) => {
    if (!userId || userId === 'undefined' || userId === 'null') {
      console.error('ERROR: Invalid userId provided to openChat:', userId)
      setGlobalMessage({
        type: 'error',
        text: 'Cannot open chat: Invalid user ID'
      })
      return
    }
    
    setSelectedChatUser(userId)
    setActiveView('chat-conversation')
  }

  const openPhotoGallery = (photos: string[], startIndex: number = 0) => {
    setGalleryPhotos(photos)
    setCurrentPhotoIndex(startIndex)
    setShowPhotoGallery(true)
  }

  const closePhotoGallery = () => {
    setShowPhotoGallery(false)
    setGalleryPhotos([])
    setCurrentPhotoIndex(0)
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % galleryPhotos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
  }

  const copyReferralValue = async (value: string | null, field: 'code' | 'link') => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setReferralCopiedField(field)
      setTimeout(() => {
        setReferralCopiedField((prev) => (prev === field ? null : prev))
      }, 2000)
    } catch (error) {
      console.error('Error copying referral value:', error)
      setGlobalMessage({
        type: 'error',
        text: 'Unable to copy right now. Please try again.'
      })
    }
  }

  const updateReferralInviteField = (field: keyof typeof referralInviteForm, value: string) => {
    setReferralInviteForm((prev) => ({ ...prev, [field]: value }))
    if (referralInviteError) {
      setReferralInviteError(null)
    }
  }

  const resetReferralInviteForm = () => {
    setReferralInviteForm({
      inviteeEmail: '',
      inviteeName: '',
      guardianEmail: '',
      message: '',
    })
    setReferralInviteError(null)
  }

  const closeReferralInviteModal = () => {
    setShowReferralInvite(false)
    setReferralInviteError(null)
  }

  const handleReferralInviteSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!referralInviteForm.inviteeEmail.trim()) {
      setReferralInviteError('Invitee email is required')
      return
    }

    setReferralInviteSubmitting(true)
    setReferralInviteError(null)

    try {
      const payload = {
        inviteeEmail: referralInviteForm.inviteeEmail.trim(),
        inviteeName: referralInviteForm.inviteeName.trim() || undefined,
        guardianEmail: referralInviteForm.guardianEmail.trim() || undefined,
        message: referralInviteForm.message.trim() || undefined,
        channel: 'email' as const,
        locale: user?.countryOfOrigin || user?.country || undefined,
        context: 'dashboard_referral_card',
      }

      const response = await fetch('/api/referrals/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        const validationError = data?.errors ? (Object.values(data.errors).flat().find(Boolean) as string | undefined) : null
        throw new Error(validationError || data?.error || 'Unable to send invite')
      }

      resetReferralInviteForm()
      setShowReferralInvite(false)
      setGlobalMessage({ type: 'success', text: 'Invite sent! We will notify you when your friend joins.' })
      await loadReferralProgress()
    } catch (error) {
      console.error('Error sending referral invite:', error)
      setReferralInviteError(error instanceof Error ? error.message : 'Unable to send invite')
    } finally {
      setReferralInviteSubmitting(false)
    }
  }

  const subscriptionPlans: SubscriptionPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: '£0',
      period: 'forever',
      icon: Star,
      gradient: 'from-gray-500 to-gray-600',
      features: ['Basic matching', 'Limited likes per day', 'Standard support', 'Profile creation']
    },
    {
      id: 'monthly',
      name: 'Monthly',
      price: '£15',
      period: 'per month',
      icon: Zap,
      gradient: 'from-blue-500 to-blue-600',
      features: ['Unlimited likes', 'See who liked you', 'Advanced filters', 'Priority support', 'Read receipts', 'Boost your profile']
    },
    {
      id: '3-months',
      name: '3 Months',
      price: '£35',
      period: 'save £10',
      icon: Crown,
      gradient: 'from-purple-500 to-purple-600',
      popular: true,
      features: ['Everything in Monthly', 'Profile verification badge', 'Exclusive events access', 'Premium matching algorithm', 'Unlimited rewinds', 'Ad-free experience']
    },
    {
      id: '6-months',
      name: '6 Months',
      price: '£60',
      period: 'save £30',
      icon: Sparkles,
      gradient: 'from-orange-500 to-red-600',
      features: ['Everything in 3-Months', 'VIP customer support', 'Featured profile placement', 'Monthly coaching session', 'Exclusive VIP badge', 'Priority customer service']
    }
  ]



  // Show loading state while checking authentication
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const userName = user?.name?.split(' ')[0] || 'there'

  const partnerLabel = (() => {
    const g = (user?.gender || '').toLowerCase()
    if (g === 'male' || g === 'man') return 'woman'
    if (g === 'female' || g === 'woman') return 'man'
    return 'partner'
  })()

  // Handle shell navigation
  const derivedNavKey: SpaNavKey =
    activeView === 'chat-conversation'
      ? 'chat'
      : activeView === 'profile-view'
      ? 'profile'
      : (activeView as SpaNavKey)

  const handleShellNavigate = (view: SpaNavKey) => {
    if (view === 'chat') {
      setActiveView('chat')
      return
    }
    if (view === 'profile') {
      setActiveView('profile')
      return
    }
    setActiveView(view)
  }

  const handleSidebarNavigate = (href: string) => {
    // Parse the href and extract view parameter or path
    if (href === '/dashboard-spa') {
      setActiveView('home')
      return
    }
    
    // Check if href contains query param
    const url = new URL(href, window.location.origin)
    const viewParam = url.searchParams.get('view')
    
    if (viewParam) {
      const validViews: ActiveView[] = ['home', 'discover', 'safety', 'profile', 'likes', 'chat', 'subscription', 'settings', 'referrals', 'spotlight']
      if (validViews.includes(viewParam as ActiveView)) {
        setActiveView(viewParam as ActiveView)
        return
      }
    }
    
    // Fallback: map path to view (for old-style paths)
    const pathMap: Record<string, ActiveView> = {
      '/discover': 'discover',
      '/chat': 'chat',
      '/likes': 'likes',
      '/safety': 'safety',
      '/settings': 'settings',
      '/profile': 'profile',
      '/subscription': 'subscription',
      '/referrals': 'referrals',
      '/spotlight': 'spotlight',
      '/premium': 'subscription',
    }
    
    const view = pathMap[url.pathname] || 'home'
    setActiveView(view)
  }

  return (
    <>
      <MemberAppShell
        title="Member workspace (beta)"
        description="Experimental concierge surface with boosts, referrals, and inbox."
        onNavigate={handleSidebarNavigate}
        actions={
          <div className="flex flex-wrap gap-2">
            <SpaViewSwitcher activeView={derivedNavKey} onNavigate={handleShellNavigate} />
          </div>
        }
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-10 pt-2 overflow-x-hidden">
        {globalMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm border flex items-start justify-between gap-3 ${
              globalMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : globalMessage.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <span>{globalMessage.text}</span>
            <button
              type="button"
              onClick={() => setGlobalMessage(null)}
              className="ml-2 text-xs font-semibold opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* HOME VIEW */}
        {activeView === 'home' && (
          <>
            {/* Premium Stats Grid with Ambient Glow (Mobile First) */}
            <SlideUp>
              <div className="relative subsection-spacing ambient-glow-purple">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { icon: Heart, label: 'Likes', value: dashboardStats.likes, trend: 'Total likes', color: 'from-red-500/20 to-pink-500/20' },
                    { icon: MessageCircle, label: 'Chats', value: dashboardStats.messages, trend: 'Active', color: 'from-blue-500/20 to-cyan-500/20' },
                    { icon: Star, label: 'Views', value: dashboardStats.views, trend: 'This week', color: 'from-yellow-500/20 to-orange-500/20' },
                    { icon: Zap, label: 'Matches', value: dashboardStats.matches, trend: 'Mutual', color: 'from-purple-royal/20 to-gold-warm/20' }
                  ].map((stat, index) => {
                    const IconComponent = stat.icon
                    return (
                      <FadeIn key={stat.label} delay={0.1 * (index + 1)}>
                        <div className="group relative">
                          {/* Glow on interaction */}
                          <div className={`absolute -inset-1 bg-gradient-to-br ${stat.color} rounded-2xl opacity-0 group-hover:opacity-100 group-active:opacity-100 blur-xl transition-all duration-500`} />
                          
                          {/* Card */}
                          <div className="relative card-premium rounded-xl md:rounded-2xl p-3 md:p-5 lg:p-6 group-hover:border-gold-warm/30 group-active:border-gold-warm/30 transition-all duration-300">
                            {/* Icon */}
                            <div className={`w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-gradient-to-br ${stat.color} rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-3 lg:mb-4 group-hover:scale-110 group-active:scale-110 transition-transform duration-300`}>
                              <IconComponent className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-gold-warm" />
                            </div>
                            
                            {/* Value */}
                            <div className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-text-primary mb-1">
                              {stat.value}
                            </div>
                            
                            {/* Label */}
                            <div className="text-xs md:text-sm text-text-secondary font-medium mb-0.5 md:mb-1">
                              {stat.label}
                            </div>
                            
                            {/* Trend */}
                            <div className="text-[10px] md:text-xs text-text-tertiary">
                              {stat.trend}
                            </div>
                          </div>
                        </div>
                      </FadeIn>
                    )
                  })}
                </div>
              </div>
            </SlideUp>

            {/* Premium Match Carousel (Mobile First) */}
            {discoverUsers.length > 0 && (
              <section className="section-spacing ambient-glow-gold">
                <FadeIn delay={0.2}>
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 md:mb-8 gap-4">
                    <div className="flex-1">
                      <Badge variant="gold" className="mb-3 inline-flex items-center gap-1.5 touch-target">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium tracking-wide">Daily Spotlight</span>
                      </Badge>
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-display text-text-primary mb-2">
                        Handpicked Matches
                      </h2>
                      <p className="text-sm md:text-base lg:text-lg text-text-secondary max-w-2xl">
                        Curated by AI based on your preferences and values
                      </p>
                    </div>
                    
                    <Button variant="ghost" className="group touch-target hidden md:flex" onClick={() => fetchDiscoverUsers()}>
                      Refresh
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </FadeIn>

                {/* Carousel with scroll hints (Mobile optimized) */}
                <div className="relative">
                  {/* Scroll hints for desktop */}
                  <div className="scroll-hint-left hidden md:block" />
                  <div className="scroll-hint-right hidden md:block" />
                  
                  {/* Horizontal scroll carousel */}
                  <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
                    {discoverUsers.slice(0, 5).map((match, index) => (
                      <FadeIn key={match._id} delay={0.3 + index * 0.1}>
                        <div className="shrink-0 w-[min(85vw,320px)] md:w-80 snap-start">
                          <PremiumProfileCard
                            profile={{
                              name: match.name,
                              age: match.age,
                              tribe: match.tribe,
                              location: `${match.city}, ${match.country}`,
                              bio: match.bio || 'No bio yet',
                              photo: match.profilePhotos?.[0] || '/placeholder.svg',
                              verified: match.isVerified || false,
                              interests: match.interests || []
                            }}
                            matchScore={Math.floor(Math.random() * 20) + 80}
                            onLike={() => console.log('Liked', match.name)}
                            onPass={() => console.log('Passed', match.name)}
                          />
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                  
                  {/* Scroll indicators for mobile */}
                  <div className="flex justify-center gap-1.5 mt-4 md:hidden">
                    {discoverUsers.slice(0, 5).map((_, index) => (
                      <div 
                        key={index} 
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === 0 ? 'bg-gold-warm w-6' : 'bg-gold-warm/30'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Who Likes You - Premium Section (Mobile First) */}
            {peopleWhoLikedMe.length > 0 && (
              <section className="section-spacing">
                <FadeIn delay={0.5}>
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 md:mb-8 gap-4">
                    <div className="flex-1">
                      <Badge variant="purple" className="mb-3 inline-flex items-center gap-1.5 touch-target">
                        <Crown className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium tracking-wide">Who Likes You</span>
                      </Badge>
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-display text-text-primary mb-2">
                        See Who's Interested
                      </h2>
                      <p className="text-sm md:text-base text-text-secondary">
                        {peopleWhoLikedMe.length} {peopleWhoLikedMe.length === 1 ? 'person has' : 'people have'} liked your profile
                      </p>
                    </div>
                    
                    <Button variant="secondary" className="group touch-target w-full md:w-auto" onClick={() => setActiveView('likes')}>
                      View All
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </FadeIn>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {peopleWhoLikedMe.slice(0, 2).map((liker, index) => (
                    <FadeIn key={liker._id} delay={0.6 + index * 0.1}>
                      <div className="group relative">
                        {/* Glow on interaction */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-purple-royal/20 to-gold-warm/20 rounded-2xl opacity-0 group-hover:opacity-100 group-active:opacity-100 blur-xl transition-all duration-500" />
                        
                        <div 
                          className="relative glass-effect rounded-2xl p-4 md:p-6 cursor-pointer card-interactive border border-gold-warm/10 group-hover:border-gold-warm/30 group-active:border-gold-warm/30 transition-all"
                          onClick={() => setActiveView('likes')}
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            <div className="relative shrink-0">
                              <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden">
                                <img 
                                  src={liker.profilePhoto || "/placeholder.svg"} 
                                  alt={liker.name}
                                  className="w-full h-full object-cover group-hover:scale-110 group-active:scale-110 transition-transform duration-500"
                                />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-purple-royal to-gold-warm flex items-center justify-center border-2 border-background-primary shadow-glow-gold">
                                <Heart className="w-3.5 h-3.5 text-white" fill="currentColor" />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-base md:text-lg text-text-primary font-semibold truncate">
                                  {liker.name}, {liker.age}
                                </h3>
                              </div>
                              <Badge variant="purple" className="mb-2 text-xs">
                                {liker.tribe}
                              </Badge>
                              <p className="text-xs md:text-sm text-text-tertiary truncate">
                                <MapPin className="w-3 h-3 inline mr-1" />
                                {liker.city}
                              </p>
                            </div>
                            
                            <Button variant="primary" size="sm" className="shrink-0 touch-target">
                              <span className="hidden md:inline">View</span>
                              <ArrowRight className="w-4 h-4 md:ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </section>
            )}

            {/* Testimonials - Premium Social Proof (Mobile First) */}
            {(!user.subscriptionPlan || user.subscriptionPlan === 'free') && testimonials.length > 0 && (
              <section className="section-spacing">
                <FadeIn delay={0.7}>
                  <div className="mb-6 md:mb-8">
                    <Badge variant="gold" className="mb-3 inline-flex items-center gap-1.5 touch-target">
                      <Star className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium tracking-wide">Success Stories</span>
                    </Badge>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display text-text-primary mb-2">
                      Stories from our Tribal Community
                    </h2>
                    <p className="text-sm md:text-base text-text-secondary max-w-3xl">
                      See how other Africans are building real connections with people who respect their tribe, faith and values.
                    </p>
                  </div>
                </FadeIn>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {testimonials.map((t, index) => (
                    <FadeIn key={t._id} delay={0.8 + index * 0.1}>
                      <div className="group relative">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-gold-warm/10 to-purple-royal/10 rounded-2xl opacity-0 group-hover:opacity-100 group-active:opacity-100 blur-xl transition-all duration-500" />
                        
                        <div className="relative card-premium rounded-xl md:rounded-2xl p-4 md:p-6">
                          {/* Header with photo and name */}
                          <div className="flex items-center gap-3 mb-3 md:mb-4">
                            {t.profilePhoto ? (
                              <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden ring-2 ring-gold-warm/20">
                                <img src={t.profilePhoto} alt={t.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-royal to-gold-warm flex items-center justify-center ring-2 ring-gold-warm/20">
                                <span className="text-white font-bold text-lg">
                                  {t.name?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm md:text-base font-semibold text-text-primary truncate">{t.name}</h3>
                              <Badge variant="purple" className="text-xs mt-1">{t.tribe}</Badge>
                            </div>
                          </div>
                          
                          {/* Star rating */}
                          <div className="flex gap-0.5 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${i < t.rating ? 'fill-gold-warm text-gold-warm' : 'text-text-tertiary'}`}
                              />
                            ))}
                          </div>
                          
                          {/* Testimonial text */}
                          <p className="text-xs md:text-sm text-text-secondary leading-relaxed line-clamp-4">
                            {t.content}
                          </p>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              </section>
            )}

            {/* Premium Inspirational Banner - Mobile First */}
            {user.subscriptionPlan && user.subscriptionPlan !== 'free' && (
              <FadeIn delay={0.9}>
                <div className="section-spacing px-4 md:px-0">
                  <div className="relative overflow-hidden rounded-3xl">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 premium-gradient-1" />
                    
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 shimmer-effect opacity-50" />
                    
                    <div className="relative text-center py-12 md:py-16 px-6">
                      <Crown className="w-12 h-12 md:w-16 md:h-16 text-gold-warm mx-auto mb-4 md:mb-6" />
                      <h3 className="text-xl md:text-2xl lg:text-3xl font-display text-white mb-3 md:mb-4">
                        {inspirationalMessages[Math.floor(Math.random() * inspirationalMessages.length)].title}
                      </h3>
                      <p className="text-sm md:text-base text-white/80 max-w-2xl mx-auto">
                        You're a premium member — enjoy unlimited access to all features
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Free User CTA - Mobile First */}
            {(!user.subscriptionPlan || user.subscriptionPlan === 'free') && (
              <FadeIn delay={0.9}>
                <div className="section-spacing px-4 md:px-0">
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-royal via-purple-royal-dark to-gold-warm p-1">
                    <div className="bg-background-primary rounded-3xl p-6 md:p-10 text-center">
                      <div className="inline-flex items-center gap-2 bg-gold-warm/10 border border-gold-warm/30 rounded-full px-4 py-2 mb-6">
                        <Sparkles className="w-4 h-4 text-gold-warm" />
                        <span className="text-sm text-gold-warm font-medium">Limited Time Offer</span>
                      </div>
                      
                      <h3 className="text-2xl md:text-3xl lg:text-4xl font-display gradient-text-royal mb-4">
                        Unlock Your Full Potential
                      </h3>
                      
                      <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto mb-8">
                        Get unlimited likes, see who viewed you, and boost your profile visibility
                      </p>
                      
                      <Button 
                        size="lg" 
                        className="btn-premium touch-target text-base md:text-lg"
                        onClick={() => setActiveView('subscription')}
                      >
                        <Crown className="w-5 h-5 mr-2" />
                        Upgrade to Premium
                      </Button>
                    </div>
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Today's Matches Section - Premium Mobile First */}
            <section className="section-spacing px-4 md:px-0">
              <FadeIn delay={1.0}>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 md:mb-8 gap-4">
                  <div className="flex-1">
                    <Badge variant="purple" className="mb-3 inline-flex items-center gap-1.5 touch-target">
                      <Heart className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium tracking-wide">Today's Picks</span>
                    </Badge>
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-display text-text-primary mb-2">
                      Matches for You
                    </h2>
                    <p className="text-sm md:text-base text-text-secondary">
                      Based on your tribe, interests, and preferences
                    </p>
                  </div>
                </div>
              </FadeIn>

              {todayMatches.length === 0 ? (
                <FadeIn delay={1.1}>
                  <div className="text-center py-12 md:py-16 card-premium rounded-3xl">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-purple-royal/20 to-gold-warm/20 flex items-center justify-center mx-auto mb-6">
                      <Heart className="w-10 h-10 md:w-12 md:h-12 text-gold-warm opacity-50" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-display text-text-primary mb-2">No matches yet</h3>
                    <p className="text-sm md:text-base text-text-secondary px-4 mb-6">
                      Complete your profile to get better matches!
                    </p>
                    <Button 
                      variant="secondary" 
                      onClick={() => setActiveView('profile')}
                      className="touch-target"
                    >
                      Complete Profile
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </FadeIn>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {todayMatches.map((person, index) => (
                    <FadeIn key={person._id} delay={1.2 + index * 0.05}>
                      <div className="group relative">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-linear-to-br from-purple-royal/20 to-gold-warm/20 rounded-3xl opacity-0 group-hover:opacity-100 group-active:opacity-100 blur-xl transition-all duration-500" />
                        
                        <div className="relative card-premium rounded-3xl overflow-hidden">
                          {/* Image Section */}
                          <div 
                            className="relative h-64 md:h-80 cursor-pointer overflow-hidden"
                            onClick={() => {
                              trackProfileView(person.email)
                              setSelectedProfile(person)
                              setActiveView('profile-view')
                            }}
                          >
                            {person.profilePhoto ? (
                              <img 
                                src={person.profilePhoto} 
                                alt={person.name}
                                className="w-full h-full object-cover group-hover:scale-110 group-active:scale-110 transition-transform duration-700"
                              />
                            ) : (
                              <div className="w-full h-full bg-linear-to-br from-purple-royal to-gold-warm flex items-center justify-center">
                                <span className="text-white text-6xl md:text-7xl font-bold opacity-50">
                                  {person.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
                            
                            {/* Match percentage badge */}
                            <div className="absolute top-4 right-4 bg-linear-to-br from-gold-warm to-gold-warm-dark px-4 py-2 rounded-full shadow-glow-gold">
                              <span className="text-sm md:text-base font-bold text-background-primary">
                                {person.matchPercentage}% Match
                              </span>
                            </div>
                          </div>
                          
                          {/* Content Section */}
                          <div className="p-4 md:p-6">
                            <h3 className="text-xl md:text-2xl font-display text-text-primary mb-2">
                              {person.name}, {person.age}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                              {person.tribe && (
                                <Badge variant="purple" className="text-xs">
                                  {person.tribe}
                                </Badge>
                              )}
                              {person.city && person.country && (
                                <span className="text-sm text-text-tertiary flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {person.city}, {person.country}
                                </span>
                              )}
                            </div>
                            
                            {/* Interests */}
                            {person.interests && person.interests.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {person.interests.slice(0, 3).map((interest: string, idx: number) => (
                                  <span 
                                    key={idx} 
                                    className="text-xs px-3 py-1.5 rounded-full bg-background-tertiary text-text-secondary border border-border-gold/20"
                                  >
                                    {interest}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-2">
                              <Button 
                                className={`touch-target transition-all ${
                                  isUserLiked(person.email) 
                                    ? 'bg-background-tertiary text-text-tertiary cursor-default' 
                                    : 'bg-linear-to-r from-purple-royal to-purple-royal-dark hover:shadow-glow-purple'
                                }`}
                                onClick={async () => {
                                  if (isUserLiked(person.email)) return
                                  try {
                                    const response = await fetch('/api/likes/like', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({ userId: person.email })
                                    })
                                    const data = await response.json()
                                    if (data.success) {
                                      setGlobalMessage({ type: 'success', text: 'User liked!' })
                                      fetchTodayMatches()
                                      fetchLikesData()
                                    } else {
                                      setGlobalMessage({ type: 'error', text: data.message || 'Failed to like user' })
                                    }
                                  } catch (error) {
                                    setGlobalMessage({ type: 'error', text: 'An error occurred' })
                                  }
                                }}
                                disabled={isUserLiked(person.email)}
                              >
                                <Heart className="w-4 h-4 md:mr-1" fill={isUserLiked(person.email) ? "currentColor" : "none"} />
                                <span className="hidden md:inline">{isUserLiked(person.email) ? 'Liked' : 'Like'}</span>
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                className="touch-target"
                                onClick={() => {
                                  trackProfileView(person.email)
                                  setSelectedProfile(person)
                                  setActiveView('profile-view')
                                }}
                              >
                                <Eye className="w-4 h-4 md:mr-1" />
                                <span className="hidden md:inline">View</span>
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                className="touch-target"
                                onClick={() => {
                                  setActiveView('chat-conversation')
                                  setSelectedChatUser(person.email)
                                  fetchChatUser(person.email)
                                }}
                              >
                                <MessageCircle className="w-4 h-4 md:mr-1" />
                                <span className="hidden md:inline">Chat</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
              )}
            </section>

            {/* Discover More People Section - Mobile Optimized */}
            <div>
              <div className="flex flex-col gap-3 mb-3 md:mb-4">
                <div className="flex items-start sm:items-center sm:justify-between gap-3">
                  <h2 className="text-xl md:text-2xl font-bold">Discover More People</h2>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="Search by name, city, or tribe..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-3 md:px-4 py-2 md:py-2.5 border border-border rounded-lg bg-background text-foreground w-full sm:w-64 text-sm md:text-base min-h-[44px] md:min-h-[40px]"
                    />
                    <Button onClick={fetchDiscoverUsers} className="min-h-[44px] md:min-h-[40px] active:scale-95 transition-transform text-sm md:text-base">
                      <Search className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                      Search
                    </Button>
                  </div>
                </div>
              </div>
              {discoverUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm md:text-base">No users found. Try adjusting your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {discoverUsers.filter(person => person.email !== user?.email).map(person => (
                    <div key={person._id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                      <div 
                        className="w-full h-56 sm:h-64 bg-linear-to-br from-primary to-accent relative cursor-pointer active:scale-[0.98] transition-transform"
                        onClick={() => {
                          trackProfileView(person.email)
                          setSelectedProfile(person)
                          setActiveView('profile-view')
                        }}
                      >
                        {person.profilePhoto ? (
                          <img 
                            src={person.profilePhoto} 
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-5xl md:text-6xl font-bold">
                            {person.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="p-3 md:p-4">
                        <h3 className="text-base md:text-lg font-bold">{person.name}, {person.age}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {person.city && person.country ? `${person.city}, ${person.country}` : 'Location not specified'}
                        </p>
                        {person.tribe && (
                          <p className="text-xs md:text-sm text-purple-500 mt-1 font-semibold">{person.tribe}</p>
                        )}
                        <div className="flex gap-2 mt-3 md:mt-4">
                          <Button 
                            className={`flex-1 min-h-[44px] md:min-h-[40px] active:scale-95 transition-transform text-xs md:text-sm ${isUserLiked(person.email) ? 'bg-gray-400 cursor-default' : 'bg-purple-600 hover:bg-purple-700'}`}
                            onClick={async () => {
                              if (isUserLiked(person.email)) return
                              
                              try {
                                const response = await fetch('/api/likes/like', {
                                  method: 'POST',
                                  headers: { 
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({ 
                                    userId: person.email
                                  })
                                })
                                const data = await response.json()
                                if (data.success) {
                                  setGlobalMessage({
                                    type: 'success',
                                    text: 'User liked!'
                                  })
                                  fetchDiscoverUsers()
                                  fetchLikesData()
                                } else {
                                  setGlobalMessage({
                                    type: 'error',
                                    text: data.message || 'Failed to like user'
                                  })
                                }
                              } catch (error) {
                                console.error('Error liking user:', error)
                                setGlobalMessage({
                                  type: 'error',
                                  text: 'An error occurred while liking this user'
                                })
                              }
                            }}
                            disabled={isUserLiked(person.email)}
                          >
                            <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                            {isUserLiked(person.email) ? 'Liked' : 'Like'}
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 min-h-[44px] md:min-h-[40px] active:scale-95 transition-transform text-xs md:text-sm"
                            onClick={() => {
                              trackProfileView(person.email)
                              setSelectedProfile(person)
                              setActiveView('profile-view')
                            }}
                          >
                            <Eye className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 min-h-[44px] md:min-h-[40px] active:scale-95 transition-transform text-xs md:text-sm"
                            onClick={() => {
                              setActiveView('chat-conversation')
                              setSelectedChatUser(person.email)
                              fetchChatUser(person.email)
                            }}
                          >
                            <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Advanced Search Modal */}
            {showAdvancedSearch && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
                <div className="absolute inset-0" onClick={() => setShowAdvancedSearch(false)} />
                <div className="relative bg-card border border-primary/30 rounded-none md:rounded-2xl shadow-[0_25px_70px_rgba(15,23,42,0.65)] w-full h-full md:h-auto md:max-h-[90vh] md:max-w-lg mx-0 md:mx-4 overflow-y-auto p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">A</span>
                        Advanced search
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">Use age, residence, origin, tribe, faith, education and work to find someone whose life matches yours.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedSearch(false)}
                      className="p-1 rounded-full hover:bg-muted"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid gap-4 md:gap-5">
                    <div className="grid gap-2 rounded-xl bg-card/90 border border-border/70 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Basics</p>
                      <Label className="text-xs md:text-sm text-muted-foreground">Marital status</Label>
                      <select
                        value={advancedFilters.maritalStatus}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maritalStatus: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                      >
                        <option value="i-dont-mind">I don't mind</option>
                        {MARITAL_STATUS_OPTIONS.filter(status =>
                          ['Single', 'Divorced', 'Widowed', 'Separated'].includes(status)
                        ).map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs md:text-sm text-muted-foreground">Min age</Label>
                        <Input
                          type="number"
                          min={30}
                          max={79}
                          value={advancedFilters.minAge}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, minAge: e.target.value }))}
                          className="mt-1 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs md:text-sm text-muted-foreground">Max age</Label>
                        <Input
                          type="number"
                          min={30}
                          max={79}
                          value={advancedFilters.maxAge}
                          onChange={(e) => setAdvancedFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                          className="mt-1 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2 rounded-xl bg-card/90 border border-border/70 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Residence</p>
                      <Label className="text-xs md:text-sm text-muted-foreground">Country of residence</Label>
                      <select
                        value={advancedFilters.country}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, country: e.target.value, city: 'i-dont-mind' }))}
                        className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                      >
                        <option value="i-dont-mind">I don't mind</option>
                        {COUNTRIES.map((country) => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm text-muted-foreground">City of residence</Label>
                      <select
                        value={advancedFilters.city}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, city: e.target.value }))}
                        disabled={advancedFilters.country === 'i-dont-mind'}
                        className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm disabled:opacity-60"
                      >
                        <option value="i-dont-mind">I don't mind</option>
                        {advancedFilters.country !== 'i-dont-mind' && getCitiesForCountry(advancedFilters.country).map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2 rounded-xl bg-card/90 border border-border/70 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Origin & tribe</p>
                      <Label className="text-xs md:text-sm text-muted-foreground">Tribe (by country of origin)</Label>
                      <select
                        value={advancedFilters.tribe}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, tribe: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                      >
                        <option value="i-dont-mind">I don't mind</option>
                        {Object.keys(AFRICAN_COUNTRIES_WITH_TRIBES).flatMap((country) =>
                          AFRICAN_COUNTRIES_WITH_TRIBES[country].map((tribe) => (
                            <option key={`${country}-${tribe}`} value={tribe}>{tribe} ({country})</option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="grid gap-2 rounded-xl bg-card/90 border border-border/70 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Work</p>
                      <Label className="text-xs md:text-sm text-muted-foreground">Work</Label>
                      <select
                        value={advancedFilters.workType}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, workType: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                      >
                        {WORK_TYPES.map((type) => (
                          <option key={type} value={
                            type === "I don't mind" ? 'i-dont-mind' : type
                          }>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2 rounded-xl bg-card/90 border border-border/70 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Faith & education</p>
                      <Label className="text-xs md:text-sm text-muted-foreground">Religion</Label>
                      <select
                        value={advancedFilters.religion}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, religion: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                      >
                        <option value="i-dont-mind">I don't mind</option>
                        {RELIGIONS.filter((r) => r !== 'Prefer not to say').map((religion) => (
                          <option key={religion} value={religion}>{religion}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm text-muted-foreground">Education</Label>
                      <select
                        value={advancedFilters.education}
                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, education: e.target.value }))}
                        className="mt-1 w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                      >
                        <option value="i-dont-mind">I don't mind</option>
                        {EDUCATION_LEVELS.filter((e) => e !== 'Prefer not to say').map((edu) => (
                          <option key={edu} value={edu}>{edu}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs md:text-sm"
                      onClick={() => {
                        setAdvancedFilters({
                          maritalStatus: 'i-dont-mind',
                          minAge: '',
                          maxAge: '',
                          country: 'i-dont-mind',
                          city: 'i-dont-mind',
                          tribe: 'i-dont-mind',
                          religion: 'i-dont-mind',
                          education: 'i-dont-mind',
                          workType: 'i-dont-mind',
                        })
                      }}
                    >
                      Clear all
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAdvancedSearch(false)}
                        className="text-xs md:text-sm"
                      >
                        Close
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          // sync basic ages/tribe from advanced if set
                          setBasicMinAge(advancedFilters.minAge ? Math.max(30, Math.min(79, parseInt(advancedFilters.minAge, 10))) : '')
                          setBasicMaxAge(advancedFilters.maxAge ? Math.max(30, Math.min(79, parseInt(advancedFilters.maxAge, 10))) : '')
                          setBasicTribe(advancedFilters.tribe || 'i-dont-mind')
                          fetchDiscoverUsers()
                          setShowAdvancedSearch(false)
                        }}
                        className="text-xs md:text-sm"
                      >
                        Apply filters
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* DISCOVER VIEW */}
        {activeView === 'discover' && (
          <div className="space-y-8">
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Discover</h1>
                <p className="text-sm md:text-base text-muted-foreground mt-2">Find your perfect match from your tribe</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="gap-2" onClick={() => fetchDiscoverUsers()}>
                  <Search className="w-4 h-4" />
                  Refresh Matches
                </Button>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </div>
            </div>

            {/* Discover Cards Grid */}
            {discoverUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {discoverUsers.map((person) => (
                  <div key={person._id} className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-br from-purple-royal/20 to-gold-warm/20 rounded-3xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500" />
                    
                    <div className="relative card-premium rounded-3xl overflow-hidden">
                      <div 
                        className="relative h-80 cursor-pointer overflow-hidden"
                        onClick={() => {
                          trackProfileView(person.email)
                          setSelectedProfile(person)
                          setActiveView('profile-view')
                        }}
                      >
                        {person.profilePhotos?.[0] ? (
                          <img 
                            src={person.profilePhotos[0]} 
                            alt={person.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-royal to-gold-warm flex items-center justify-center">
                            <span className="text-white text-7xl font-bold opacity-50">
                              {person.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        
                        {person.isVerified && (
                          <div className="absolute top-4 right-4">
                            <Badge variant="gold" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verified
                            </Badge>
                          </div>
                        )}
                        
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-2xl font-bold text-white mb-2">
                            {person.name}, {person.age}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {person.tribe && (
                              <Badge variant="purple">
                                {person.tribe}
                              </Badge>
                            )}
                            {person.religion && (
                              <Badge variant="outline" className="bg-black/40 text-white border-white/20">
                                {person.religion}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-white/90 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {person.city}, {person.country}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {person.bio || "No bio available"}
                        </p>
                        
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1 gap-2">
                            <X className="w-4 h-4" />
                            Pass
                          </Button>
                          <Button className="flex-1 gap-2">
                            <Heart className="w-4 h-4" />
                            Like
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-premium rounded-3xl p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground mb-6">Check back later for new profiles</p>
                <Button onClick={() => fetchDiscoverUsers()}>
                  Refresh
                </Button>
              </div>
            )}
          </div>
        )}

        {/* SAFETY VIEW */}
        {activeView === 'safety' && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary">Safety & Verification</h1>
              <p className="text-sm md:text-base text-muted-foreground mt-2">Protect yourself and build trust in the community</p>
            </div>

            {/* Verification Status Card */}
            <div className="card-premium rounded-3xl p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  user?.verified 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {user?.verified ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Clock className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">
                    {user?.verified ? 'Account Verified' : 'Verification Pending'}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {user?.verified 
                      ? 'Your account is verified. You can now access all features.' 
                      : 'Complete verification to unlock private messaging and show you\'re a real person.'}
                  </p>
                  {!user?.verified && (
                    <Button className="gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      Start Verification
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Safety Tips Grid */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Safety Tips</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    icon: ShieldCheck,
                    title: 'Verify profiles',
                    description: 'Look for the verified badge on profiles. It means they\'ve confirmed their identity.',
                    color: 'from-blue-500/20 to-cyan-500/20'
                  },
                  {
                    icon: Lock,
                    title: 'Keep personal info private',
                    description: 'Don\'t share your phone number, address, or financial details until you\'ve built trust.',
                    color: 'from-purple-500/20 to-pink-500/20'
                  },
                  {
                    icon: MessageCircle,
                    title: 'Chat on the platform first',
                    description: 'Get to know someone through our chat before moving to other messaging apps.',
                    color: 'from-green-500/20 to-emerald-500/20'
                  },
                  {
                    icon: Eye,
                    title: 'Meet in public places',
                    description: 'When meeting in person, choose busy, public locations and let someone know where you\'ll be.',
                    color: 'from-orange-500/20 to-red-500/20'
                  },
                  {
                    icon: Bell,
                    title: 'Trust your instincts',
                    description: 'If something feels off, it probably is. Don\'t hesitate to report suspicious behavior.',
                    color: 'from-yellow-500/20 to-orange-500/20'
                  },
                  {
                    icon: X,
                    title: 'Block & report',
                    description: 'Use our tools to block users who make you uncomfortable and report violations.',
                    color: 'from-red-500/20 to-pink-500/20'
                  }
                ].map((tip, index) => {
                  const IconComponent = tip.icon
                  return (
                    <div key={index} className="group relative">
                      <div className={`absolute -inset-1 bg-gradient-to-br ${tip.color} rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500`} />
                      <div className="relative card-premium rounded-2xl p-6">
                        <div className={`w-12 h-12 bg-gradient-to-br ${tip.color} rounded-xl flex items-center justify-center mb-4`}>
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{tip.title}</h3>
                        <p className="text-sm text-muted-foreground">{tip.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Report & Block Section */}
            <div className="card-premium rounded-3xl p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-4">Report Concerns</h2>
              <p className="text-muted-foreground mb-6">
                If you encounter inappropriate behavior, fake profiles, or anything that makes you uncomfortable, let us know immediately.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="destructive" className="gap-2">
                  <Bell className="w-4 h-4" />
                  Report a User
                </Button>
                <Button variant="outline" className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Safety Guidelines
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {activeView === 'profile' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your personal information and photos</p>
              </div>
              <Button 
                onClick={() => setIsEditing(!isEditing)} 
                className={`min-h-10 transition-all ${
                  isEditing 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-accent hover:bg-accent/90'
                }`}
              >
                {isEditing ? '✕ Cancel Edit' : '✏️ Edit Profile'}
              </Button>
            </div>

            {profileMessage && (
              <div className={`mb-6 p-4 rounded-lg border ${
                profileMessage.includes('success') 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {profileMessage}
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                {user.profilePhotos && user.profilePhotos[0] ? (
                  <img src={user.profilePhotos[0]} alt={user.name} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-4xl font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-2xl font-bold">{user.name}</h2>
                    {user.verified ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <Clock className="w-6 h-6 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-accent font-medium">@{user.username || 'username'}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 bg-accent text-accent-foreground rounded-full text-sm font-semibold">
                    {user.subscriptionPlan || 'Free'} Plan
                  </span>
                </div>
              </div>

              {isEditing === false && (
                <div className="space-y-4">
                  {user.bio && <p className="text-muted-foreground">{user.bio}</p>}
                  <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-border">
                    {[
                      { label: 'Age', value: user.age },
                      { label: 'Gender', value: user.gender },
                      { label: 'Location', value: `${user.city}, ${user.country}` },
                      { label: 'Tribe', value: user.tribe },
                      { label: 'Marital Status', value: user.maritalStatus },
                      { label: 'Height', value: user.height },
                      { label: 'Body Type', value: user.bodyType },
                      { label: 'Education', value: user.education },
                      { label: 'Occupation', value: user.occupation },
                      { label: 'Work type', value: (user as any).workType },
                      { label: 'Religion', value: user.religion },
                      { label: 'Looking For', value: user.lookingFor }
                    ].filter(item => item.value).map(item => (
                      <div key={item.label}>
                        <span className="text-sm text-muted-foreground">{item.label}:</span>
                        <span className="ml-2 font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {user.profilePhotos && user.profilePhotos.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <h3 className="font-bold mb-3">Photos ({user.profilePhotos.length}/10)</h3>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        {user.profilePhotos.map((photo: string, index: number) => (
                          <img key={index} src={photo} alt={`Photo ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {isEditing === true && formData && Object.keys(formData).length > 0 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                    <div className="mb-4">
                      <Label className="text-base font-bold mb-2 block">Upload Profile Photos ({(formData.profilePhotos || []).length}/10)</Label>
                      <p className="text-sm text-muted-foreground mb-3">Add up to 10 photos. Your first photo will be your main profile picture.</p>
                    </div>
                    <label className="block">
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-100 transition">
                        <div className="text-blue-600 font-semibold mb-2">+ Click to upload photos</div>
                        <p className="text-xs text-muted-foreground">Select multiple images at once</p>
                      </div>
                      <Input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    </label>
                    {formData.profilePhotos && formData.profilePhotos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2 text-sm">Your Photos</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {(formData.profilePhotos || []).map((photo: string, index: number) => (
                            <div key={index} className="relative group">
                              <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                              {index === 0 && (
                                <div className="absolute top-1 left-1 bg-accent text-white text-xs px-2 py-1 rounded font-bold">
                                  PRIMARY
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                                title="Remove photo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Drag photos to reorder them, or remove with the X button</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-bold mb-4">Personal Details</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                      <Label>Date of Birth</Label>
                      <Input type="date" value={formData.dateOfBirth || ''} onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} />
                    </div>
                  </div>

                  <div>
                    <Label>Bio</Label>
                    <Textarea value={formData.bio || ''} onChange={(e) => setFormData({...formData, bio: e.target.value})} rows={4} />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Gender</Label>
                      <select value={formData.gender || ''} onChange={(e) => handleProfileFieldChange('gender', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg">
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <Label>Marital Status</Label>
                      <select value={formData.maritalStatus || ''} onChange={(e) => handleProfileFieldChange('maritalStatus', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg">
                        <option value="">Select status</option>
                        {MARITAL_STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Height</Label>
                      <select value={formData.height || ''} onChange={(e) => handleProfileFieldChange('height', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg">
                        <option value="">Select height</option>
                        {HEIGHTS_IN_FEET.map(height => (
                          <option key={height} value={height}>{height}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Body Type</Label>
                      <select value={formData.bodyType || ''} onChange={(e) => handleProfileFieldChange('bodyType', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg">
                        <option value="">Select body type</option>
                        <option value="Slim">Slim</option>
                        <option value="Athletic">Athletic</option>
                        <option value="Average">Average</option>
                        <option value="Curvy">Curvy</option>
                        <option value="Plus Size">Plus Size</option>
                      </select>
                    </div>
                    <div>
                      <Label>Education</Label>
                      <select value={formData.education || ''} onChange={(e) => handleProfileFieldChange('education', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg">
                        <option value="">Select education level</option>
                        {EDUCATION_LEVELS.map(edu => (
                          <option key={edu} value={edu}>{edu}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Occupation</Label>
                      <Input value={formData.occupation || ''} onChange={(e) => handleProfileFieldChange('occupation', e.target.value)} />
                    </div>
                    <div>
                      <Label>Work type</Label>
                      <select
                        value={formData.workType || ''}
                        onChange={(e) => handleProfileFieldChange('workType', e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg"
                      >
                        <option value="">Select work type</option>
                        {WORK_TYPES.filter((t) => t !== "I don't mind").map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Religion</Label>
                      <select value={formData.religion || ''} onChange={(e) => handleProfileFieldChange('religion', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg">
                        <option value="">Select religion</option>
                        {RELIGIONS.map(religion => (
                          <option key={religion} value={religion}>{religion}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Looking For</Label>
                      <select value={formData.lookingFor || ''} onChange={(e) => handleProfileFieldChange('lookingFor', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg">
                        <option value="">Select preference</option>
                        {LOOKING_FOR_OPTIONS.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Current Residence</Label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Country</Label>
                          <select value={formData.country || ''} onChange={(e) => handleProfileFieldChange('country', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg">
                            <option value="">Select country</option>
                            {COUNTRIES.map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>City</Label>
                          <select 
                            value={formData.city || ''} 
                            onChange={(e) => handleProfileFieldChange('city', e.target.value)} 
                            className="w-full px-4 py-2 border border-border rounded-lg"
                            disabled={!formData.country}
                          >
                            <option value="">Select city</option>
                            {formData.country && getCitiesForCountry(formData.country).map(city => (
                              <option key={city} value={city}>{city}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block">Heritage & Origin</Label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Country of Origin</Label>
                          <select value={formData.countryOfOrigin || ''} onChange={(e) => handleProfileFieldChange('countryOfOrigin', e.target.value)} className="w-full px-4 py-2 border border-border rounded-lg">
                            <option value="">Select country of origin</option>
                            {Object.keys(AFRICAN_COUNTRIES_WITH_TRIBES).map(country => (
                              <option key={country} value={country}>{country}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>Tribe</Label>
                          <select 
                            value={formData.tribe || ''} 
                            onChange={(e) => handleProfileFieldChange('tribe', e.target.value)} 
                            className="w-full px-4 py-2 border border-border rounded-lg"
                            disabled={!formData.countryOfOrigin}
                          >
                            <option value="">Select tribe</option>
                            {formData.countryOfOrigin && getTribesForCountry(formData.countryOfOrigin).map(tribe => (
                              <option key={tribe} value={tribe}>{tribe}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-base font-semibold mb-3 block">
                        Interests ({Array.isArray(formData.interests) ? formData.interests.length : 0} selected)
                      </Label>
                      <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {INTERESTS_OPTIONS.map((interest) => (
                            <label key={interest} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                              <input
                                type="checkbox"
                                checked={Array.isArray(formData.interests) && formData.interests.includes(interest)}
                                onChange={() => handleInterestToggle(interest)}
                                className="w-4 h-4 rounded border-border"
                              />
                              <span className="text-sm">{interest}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                    <Button 
                      onClick={handleSaveProfile} 
                      disabled={loading} 
                      className="flex-1 bg-green-600 hover:bg-green-700 min-h-11 text-base font-semibold"
                    >
                      {loading ? '⏳ Saving...' : '✓ Save All Changes'}
                    </Button>
                    <Button 
                      onClick={() => setIsEditing(false)} 
                      variant="outline"
                      className="flex-1 min-h-11"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveView('subscription')}
                className="bg-card border border-border rounded-lg p-6 text-left hover:bg-muted transition"
              >
                <h3 className="font-bold text-lg mb-2">Subscription</h3>
                <p className="text-sm text-muted-foreground">Manage your plan and billing</p>
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className="bg-card border border-border rounded-lg p-6 text-left hover:bg-muted transition"
              >
                <h3 className="font-bold text-lg mb-2">Settings</h3>
                <p className="text-sm text-muted-foreground">Privacy, notifications, and security</p>
              </button>
            </div>
          </div>
        )}

        {/* LIKES VIEW - Continuation in next part due to length */}
        {activeView === 'likes' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Likes & Views</h1>

            <div className="flex gap-2 mb-8 overflow-x-auto">
              {[
                { id: 'likedMe', label: 'Who Liked Me', count: peopleWhoLikedMe.length },
                { id: 'liked', label: 'I Liked', count: peopleILiked.length },
                { id: 'views', label: 'Profile Views', count: profileViews.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition ${
                    activeTab === tab.id
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-card border border-border hover:bg-muted'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                  {tab.label}
                  <span className="px-2 py-0.5 rounded-full text-xs bg-background/20">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === 'likedMe' && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {peopleWhoLikedMe.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-xl font-semibold mb-2">No likes yet</p>
                        <p className="text-muted-foreground">Keep swiping to get more matches!</p>
                      </div>
                    ) : (
                      peopleWhoLikedMe.map((person, index) => {
                        const isFreeUser = !user?.subscriptionPlan || user.subscriptionPlan === 'free'
                        const shouldBlur = isFreeUser && index > 0

                        return (
                          <div key={person._id} className={`bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition relative ${shouldBlur ? 'pointer-events-none' : ''}`}>
                            {person.profilePhoto ? (
                              <img src={person.profilePhoto} alt={person.name} className={`w-full h-64 object-cover ${shouldBlur ? 'blur-lg' : ''}`} />
                            ) : (
                              <div className={`w-full h-64 bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-6xl font-bold ${shouldBlur ? 'blur-lg' : ''}`}>
                                {person.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className={`p-4 ${shouldBlur ? 'blur-sm' : ''}`}>
                              <h3 className="text-lg font-bold">{person.name}, {person.age}</h3>
                              <p className="text-sm text-muted-foreground mb-1">{person.city}</p>
                              <p className="text-xs text-accent font-semibold mb-2">{person.tribe}</p>
                              <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(person.likedAt)}
                              </p>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => handleLikeBack(person.userId)} 
                                  className={`flex-1 ${isUserLiked(person.userId) ? 'bg-gray-400 cursor-default' : ''}`}
                                  disabled={isUserLiked(person.userId)}
                                >
                                  <Heart className="w-4 h-4 mr-2" />
                                  {isUserLiked(person.userId) ? 'Liked' : 'Like Back'}
                                </Button>
                                <Button 
                                  variant="outline" 
                                  className="px-4"
                                  onClick={() => {
                                    trackProfileView(person.userId)
                                    setSelectedProfile(person)
                                    setActiveView('profile-view')
                                  }}
                                >
                                  View
                                </Button>
                              </div>
                            </div>
                            {shouldBlur && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
                                <div className="bg-white rounded-xl p-6 text-center max-w-xs mx-4 shadow-2xl">
                                  <Crown className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                                  <h3 className="text-lg font-bold text-gray-900 mb-2">Upgrade to Premium</h3>
                                  <p className="text-sm text-gray-600 mb-4">Unlock all your likes and see who's interested in you!</p>
                                  <Button onClick={() => setActiveView('subscription')} className="w-full">
                                    View Plans
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}

                {activeTab === 'liked' && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {peopleILiked.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-xl font-semibold mb-2">You haven't liked anyone yet</p>
                        <p className="text-muted-foreground">Start exploring profiles to find your match!</p>
                      </div>
                    ) : (
                      peopleILiked.map((person) => (
                        <div key={person._id} className="bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                          {person.profilePhoto ? (
                            <img src={person.profilePhoto} alt={person.name} className="w-full h-64 object-cover" />
                          ) : (
                            <div className="w-full h-64 bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-6xl font-bold">
                              {person.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="text-lg font-bold">{person.name}, {person.age}</h3>
                            <p className="text-sm text-muted-foreground mb-1">{person.city}</p>
                            <p className="text-xs text-accent font-semibold mb-2">{person.tribe}</p>
                            <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(person.likedAt)}
                            </p>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => {
                                  trackProfileView(person.userId)
                                  setSelectedProfile(person)
                                  setActiveView('profile-view')
                                }}
                              >
                                View Profile
                              </Button>
                              <Button variant="destructive" className="px-4" onClick={() => handleUnlike(person.userId)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'views' && (
                  <div className="space-y-4">
                    {profileViews.length === 0 ? (
                      <div className="text-center py-12">
                        <Eye className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-xl font-semibold mb-2">No profile views yet</p>
                        <p className="text-muted-foreground">Your profile will start getting views soon!</p>
                      </div>
                    ) : (
                      profileViews.map((view, index) => {
                        const isFreeUser = !user?.subscriptionPlan || user.subscriptionPlan === 'free'
                        const shouldBlur = isFreeUser && index > 0
                        
                        return (
                          <div key={view._id} className={`bg-card border border-border rounded-lg p-4 flex items-center gap-4 hover:shadow-md transition relative ${shouldBlur ? 'pointer-events-none' : ''}`}>
                            {view.profilePhoto ? (
                              <img src={view.profilePhoto} alt={view.name} className={`w-20 h-20 rounded-full object-cover ${shouldBlur ? 'blur-lg' : ''}`} />
                            ) : (
                              <div className={`w-20 h-20 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold ${shouldBlur ? 'blur-lg' : ''}`}>
                                {view.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className={`flex-1 ${shouldBlur ? 'blur-sm' : ''}`}>
                              <h3 className="font-bold text-lg">{view.name}, {view.age}</h3>
                              <p className="text-sm text-muted-foreground">{view.city}</p>
                              <p className="text-xs text-accent font-semibold">{view.tribe}</p>
                            </div>
                            <div className={`text-right ${shouldBlur ? 'blur-sm' : ''}`}>
                              <p className="text-sm font-semibold mb-1">
                                {formatDuration(view.duration)} viewing time
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(view.viewedAt)}
                              </p>
                            </div>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                trackProfileView(view.userId)
                                setSelectedProfile(view)
                                setActiveView('profile-view')
                              }}
                              className={shouldBlur ? 'blur-sm' : ''}
                            >
                              View Profile
                            </Button>
                            {shouldBlur && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] rounded-lg">
                                <div className="bg-white rounded-xl p-6 text-center max-w-xs mx-4 shadow-2xl">
                                  <Crown className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                                  <h3 className="text-lg font-bold text-gray-900 mb-2">Upgrade to Premium</h3>
                                  <p className="text-sm text-gray-600 mb-4">See everyone who viewed your profile!</p>
                                  <Button onClick={() => setActiveView('subscription')} className="w-full">
                                    View Plans
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CHAT LIST VIEW */}
        {activeView === 'chat' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Messages</h1>

            {conversations.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-xl font-semibold mb-2">No conversations yet</p>
                <p className="text-muted-foreground">Start chatting with people you like!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const isFreeUser = !user?.subscriptionPlan || user.subscriptionPlan === 'free'

                  if (isFreeUser) {
                    const [firstConversation, ...otherConversations] = conversations

                    return (
                      <>
                        {/* First conversation - visible */}
                        {firstConversation && (
                          <button
                            key={firstConversation.userId}
                            onClick={() => openChat(firstConversation.userId)}
                            className="w-full bg-card border border-border rounded-lg p-4 hover:bg-muted transition flex items-center gap-4"
                          >
                            <div className="relative">
                              {firstConversation.avatar ? (
                                <img src={firstConversation.avatar} alt={firstConversation.name} className="w-16 h-16 rounded-full object-cover" />
                              ) : (
                                <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                                  {firstConversation.name.charAt(0)}
                                </div>
                              )}
                              {firstConversation.online && (
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-card rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold">{firstConversation.name}</h3>
                                <span className="text-xs text-muted-foreground">{firstConversation.time}</span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{firstConversation.lastMessage}</p>
                            </div>
                            {firstConversation.unread > 0 && (
                              <div className="w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                                {firstConversation.unread}
                              </div>
                            )}
                          </button>
                        )}

                        {/* Other conversations - blurred with upgrade CTA */}
                        {otherConversations.length > 0 && (
                          <div className="relative mt-4">
                            <div className="space-y-2 blur-sm pointer-events-none select-none">
                              {otherConversations.map((conversation) => (
                                <div
                                  key={conversation.userId}
                                  className="w-full bg-card border border-border rounded-lg p-4 flex items-center gap-4"
                                >
                                  <div className="relative">
                                    {conversation.avatar ? (
                                      <img src={conversation.avatar} alt={conversation.name} className="w-16 h-16 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                                        {conversation.name.charAt(0)}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 text-left">
                                    <div className="flex items-center justify-between mb-1">
                                      <h3 className="font-bold">{conversation.name}</h3>
                                      <span className="text-xs text-muted-foreground">{conversation.time}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-card/95 border border-border rounded-xl p-4 text-center max-w-xs mx-4 shadow-2xl">
                                <Crown className="w-10 h-10 mx-auto mb-2 text-orange-500" />
                                <h3 className="font-bold mb-1">Upgrade to see all chats</h3>
                                <p className="text-xs text-muted-foreground mb-3">
                                  More people have messaged you. As a free member you only see the first conversation clearly.
                                </p>
                                <Button size="sm" className="w-full" onClick={() => setActiveView('subscription')}>
                                  View Premium Plans
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  }

                  // Premium users: show all conversations normally
                  return conversations.map((conversation) => (
                    <button
                      key={conversation.userId}
                      onClick={() => openChat(conversation.userId)}
                      className="w-full bg-card border border-border rounded-lg p-4 hover:bg-muted transition flex items-center gap-4"
                    >
                      <div className="relative">
                        {conversation.avatar ? (
                          <img src={conversation.avatar} alt={conversation.name} className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-xl font-bold">
                            {conversation.name.charAt(0)}
                          </div>
                        )}
                        {conversation.online && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-card rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold">{conversation.name}</h3>
                          <span className="text-xs text-muted-foreground">{conversation.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                      </div>
                      {conversation.unread > 0 && (
                        <div className="w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-xs font-bold">
                          {conversation.unread}
                        </div>
                      )}
                    </button>
                  ))
                })()}
              </div>
            )}
          </div>
        )}

        {/* CHAT CONVERSATION VIEW */}
        {activeView === 'chat-conversation' && chatUser && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-lg shadow-lg flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
              {/* Chat Header */}
              <div className="flex items-center gap-4 p-4 border-b border-border">
                <button onClick={() => setActiveView('chat')} className="p-2 hover:bg-muted rounded-lg">
                  <ArrowLeft className="w-6 h-6" />
                </button>
                {chatUser.profilePhoto ? (
                  <img src={chatUser.profilePhoto} alt={chatUser.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center text-white text-lg font-bold">
                    {chatUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="font-bold">{chatUser.name}, {chatUser.age}</h2>
                  {chatUser.username && (
                    <p className="text-xs text-accent font-medium">@{chatUser.username}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{chatUser.city}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-xl font-semibold mb-2">No messages yet</p>
                    <p className="text-muted-foreground">Start the conversation!</p>
                  </div>
                ) : (
                  (() => {
                    const isFreeUser = !user?.subscriptionPlan || user.subscriptionPlan === 'free'

                    // For free users, we only show the FIRST message of ONE user clearly.
                    // The rest of the conversation gets a blur overlay with an upgrade CTA.
                    if (isFreeUser && messages.length > 0) {
                      const firstMessage = messages[0]
                      const restMessages = messages.slice(1)

                      return (
                        <>
                          {/* First message - always visible */}
                          {(() => {
                            const message = firstMessage
                            const isSent = message.senderId === user.email
                            return (
                              <div key={message._id}>
                                <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}>
                                  {!isSent && chatUser.profilePhoto && (
                                    <img src={chatUser.profilePhoto} alt={chatUser.name} className="w-8 h-8 rounded-full mr-2" />
                                  )}
                                  <div className={`max-w-[70%] ${isSent ? 'bg-accent text-accent-foreground rounded-br-none' : 'bg-card border border-border rounded-bl-none'} rounded-lg p-3`}>
                                    <p>{message.message}</p>
                                    <p className={`text-xs mt-1 ${isSent ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
                                      {formatTime(message.createdAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          })()}

                          {/* Rest of messages - blurred with upgrade prompt */}
                          {restMessages.length > 0 && (
                            <div className="relative mt-4">
                              <div className="space-y-2 blur-sm pointer-events-none select-none">
                                {restMessages.map((message) => {
                                  const isSent = message.senderId === user.email
                                  return (
                                    <div key={message._id} className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}>
                                      {!isSent && chatUser.profilePhoto && (
                                        <img src={chatUser.profilePhoto} alt={chatUser.name} className="w-8 h-8 rounded-full mr-2" />
                                      )}
                                      <div className={`max-w-[70%] ${isSent ? 'bg-accent text-accent-foreground rounded-br-none' : 'bg-card border border-border rounded-bl-none'} rounded-lg p-3`}>
                                        <p>{message.message}</p>
                                        <p className={`text-xs mt-1 ${isSent ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
                                          {formatTime(message.createdAt)}
                                        </p>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-card/95 border border-border rounded-xl p-4 text-center max-w-xs mx-4 shadow-2xl">
                                  <Crown className="w-10 h-10 mx-auto mb-2 text-orange-500" />
                                  <h3 className="font-bold mb-1">Upgrade to read all messages</h3>
                                  <p className="text-xs text-muted-foreground mb-3">
                                    You have more messages in this chat. As a free member you can only see one message per person.
                                  </p>
                                  <Button size="sm" className="w-full" onClick={() => setActiveView('subscription')}>
                                    View Premium Plans
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )
                    }

                    // Premium users (or if somehow no restriction applies): show full conversation normally
                    return messages.map((message, index) => {
                      const showDateDivider = index === 0 || formatDate(messages[index - 1].createdAt) !== formatDate(message.createdAt)
                      const isSent = message.senderId === user.email

                      return (
                        <div key={message._id}>
                          {showDateDivider && (
                            <div className="flex items-center justify-center my-4">
                              <span className="px-4 py-1 bg-muted rounded-full text-xs text-muted-foreground">
                                {formatDate(message.createdAt)}
                              </span>
                            </div>
                          )}

                          <div className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}>
                            {!isSent && chatUser.profilePhoto && (
                              <img src={chatUser.profilePhoto} alt={chatUser.name} className="w-8 h-8 rounded-full mr-2" />
                            )}
                            <div className={`max-w-[70%] ${isSent ? 'bg-accent text-accent-foreground rounded-br-none' : 'bg-card border border-border rounded-bl-none'} rounded-lg p-3`}>
                              <p>{message.message}</p>
                              <p className={`text-xs mt-1 ${isSent ? 'text-accent-foreground/70' : 'text-muted-foreground'}`}>
                                {formatTime(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                {showEmojiPicker && (
                  <div className="grid grid-cols-8 gap-2 mb-4 p-4 bg-muted rounded-lg">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setNewMessage(newMessage + emoji)
                          setShowEmojiPicker(false)
                        }}
                        className="text-2xl hover:scale-125 transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-3 hover:bg-muted rounded-lg transition"
                  >
                    <Smile className="w-6 h-6" />
                  </button>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage(e)
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 resize-none"
                    rows={1}
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || loading || (!user?.subscriptionPlan || user.subscriptionPlan === 'free') && freeMessageLimitReached}
                    className="px-6"
                  >
                    <Send className="w-5 h-5 mr-1" />
                    {(!user?.subscriptionPlan || user.subscriptionPlan === 'free') && freeMessageLimitReached ? 'Upgrade to reply' : 'Send'}
                  </Button>
                </form>
                {(!user?.subscriptionPlan || user.subscriptionPlan === 'free') && (
                  <p className="mt-2 text-xs text-muted-foreground text-center">
                    As a free member, you can only send one message to each person and only see one message in each chat. Upgrade to unlock full conversations.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIPTION VIEW */}
        {activeView === 'subscription' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Subscription Plans</h1>

            <div className="bg-card border border-border rounded-xl p-6 mb-10">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <WalletCards className="w-10 h-10 text-accent" />
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet checkout availability</p>
                    <h2 className="text-xl font-semibold">Apple Pay & Google Pay</h2>
                    {walletRegionHint && (
                      <p className="text-xs text-muted-foreground">Detected region: {walletRegionHint}</p>
                    )}
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {walletOptionsLoading && (
                    <span className="text-xs text-muted-foreground">Refreshing…</span>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={loadWalletOptions}
                    disabled={walletOptionsLoading}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
              {walletOptionsLoading ? (
                <p className="text-sm text-muted-foreground">Checking wallet availability in your region…</p>
              ) : walletOptions ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {( ['apple_pay', 'google_pay'] as WalletProvider[] ).map((provider) => {
                      const meta = WALLET_PROVIDER_META[provider]
                      const status = walletOptions.wallets[provider]
                      const enabled = Boolean(status?.enabled)
                      const Icon = meta.icon
                      return (
                        <div key={provider} className="border border-border rounded-lg p-4 flex items-center gap-3">
                          <Icon className={`w-6 h-6 ${enabled ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                          <div className="flex-1">
                            <p className="font-medium text-sm flex items-center gap-2">
                              {meta.label}
                              <span className={`text-xs px-2 py-0.5 rounded-full ${enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                {enabled ? 'Enabled' : 'Coming soon'}
                              </span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {enabled
                                ? `Ready in ${walletOptions.region.toUpperCase()} · ${walletOptions.currency}`
                                : `Not live in ${walletOptions.region.toUpperCase()} yet`}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    Region: {walletOptions.region.toUpperCase()} · Currency: {walletOptions.currency} · Fallback:{' '}
                    {walletOptions.fallbackProvider === 'stripe' ? 'Stripe card checkout' : 'Paystack transfer link'}
                  </p>
                  {!walletOptions.wallets.apple_pay.enabled && !walletOptions.wallets.google_pay.enabled && (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 text-xs">
                      We're rolling out wallets in your area. We'll route you through {walletOptions.fallbackProvider === 'stripe' ? 'Stripe' : 'Paystack'} until Apple Pay or Google Pay is approved.
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {walletOptionsError ?? 'We were unable to fetch wallet availability. Try again shortly or continue with card checkout.'}
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {subscriptionPlans.map((plan) => {
                const Icon = plan.icon
                const isCurrentPlan = user.subscriptionPlan === plan.id
                const walletButtonsEnabled =
                  plan.id !== 'free' &&
                  walletOptions &&
                  (walletOptions.wallets.apple_pay.enabled || walletOptions.wallets.google_pay.enabled)

                return (
                  <div
                    key={plan.id}
                    className={`bg-card border-2 rounded-lg overflow-hidden shadow-lg ${
                      plan.popular ? 'border-accent' : 'border-border'
                    } ${isCurrentPlan ? 'ring-2 ring-accent' : ''}`}
                  >
                    {plan.popular && (
                      <div className="bg-accent text-accent-foreground text-center py-2 font-bold text-sm">
                        MOST POPULAR
                      </div>
                    )}
                    <div className={`bg-linear-to-br ${plan.gradient} text-white p-6 text-center`}>
                      <Icon className="w-12 h-12 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold mb-1">{plan.price}</div>
                      <div className="text-sm opacity-90">{plan.period}</div>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={isCurrentPlan || loading}
                        className="w-full"
                        variant={isCurrentPlan ? 'outline' : 'default'}
                      >
                        {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                      </Button>
                      {plan.id !== 'free' && (
                        <div className="mt-4 space-y-2">
                          {walletOptionsLoading && !walletOptions && (
                            <p className="text-xs text-muted-foreground">Checking wallet availability…</p>
                          )}
                          {walletButtonsEnabled && (
                            ( ['apple_pay', 'google_pay'] as WalletProvider[] ).map((provider) => {
                              if (!walletOptions?.wallets[provider].enabled) return null
                              const meta = WALLET_PROVIDER_META[provider]
                              const Icon = meta.icon
                              const paidPlanId = plan.id as PaidSubscriptionPlanId
                              const pending = isWalletCheckoutPending(provider, paidPlanId)
                              return (
                                <Button
                                  key={`${plan.id}-${provider}`}
                                  type="button"
                                  variant="outline"
                                  className="w-full flex items-center justify-center gap-2"
                                  onClick={() => handleWalletCheckout(provider, paidPlanId)}
                                  disabled={pending}
                                >
                                  <Icon className="w-4 h-4" />
                                  {pending ? `Starting ${meta.label}…` : `Pay with ${meta.label}`}
                                </Button>
                              )
                            })
                          )}
                          {walletOptions &&
                            !walletOptionsLoading &&
                            !walletOptionsError &&
                            !walletOptions.wallets.apple_pay.enabled &&
                            !walletOptions.wallets.google_pay.enabled && (
                              <p className="text-xs text-muted-foreground">
                                We'll process this upgrade via {walletOptions.fallbackProvider === 'stripe' ? 'Stripe card checkout' : 'Paystack'} for now.
                              </p>
                            )}
                          {walletOptionsError && (
                            <p className="text-xs text-red-600">{walletOptionsError}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {activeView === 'settings' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Settings</h1>

            <div className="max-w-3xl space-y-6">
              {/* Account */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <UserIcon className="w-6 h-6 text-accent" />
                  <h2 className="text-xl font-bold">Account</h2>
                </div>
                <div className="space-y-3">
                  <button onClick={() => setActiveView('profile')} className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition text-left">
                    <span className="font-medium">Edit Profile</span>
                  </button>
                  <button onClick={() => setActiveView('subscription')} className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition text-left">
                    <span className="font-medium">Subscription & Billing</span>
                    <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full">
                      {user?.subscriptionPlan || 'Free'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Bell className="w-6 h-6 text-accent" />
                  <h2 className="text-xl font-bold">Notifications</h2>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates via email</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                      className="w-5 h-5"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Get notified on your device</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
                      className="w-5 h-5"
                    />
                  </label>
                </div>
              </div>

              {/* Privacy */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Lock className="w-6 h-6 text-accent" />
                  <h2 className="text-xl font-bold">Privacy & Safety</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium mb-2">Profile Visibility</label>
                    <select
                      value={settings.profileVisibility}
                      onChange={(e) => setSettings({...settings, profileVisibility: e.target.value})}
                      className="w-full px-4 py-2 border border-border rounded-lg"
                    >
                      <option value="public">Public</option>
                      <option value="members">Members Only</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium">Show Online Status</p>
                      <p className="text-sm text-muted-foreground">Display when you are active to your matches</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showOnlineStatus}
                      onChange={(e) => setSettings({...settings, showOnlineStatus: e.target.checked})}
                      className="w-5 h-5"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium">Allow New Messages</p>
                      <p className="text-sm text-muted-foreground">Let verified members reach out</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.allowMessages}
                      onChange={(e) => setSettings({...settings, allowMessages: e.target.checked})}
                      className="w-5 h-5"
                    />
                  </label>
                </div>
              </div>

              {/* Security */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="w-6 h-6 text-accent" />
                  <h2 className="text-xl font-bold">Security</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Reinforce passkeys and guardian approvals.</p>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition text-left">
                    <span className="font-medium">Change Password</span>
                  </button>
                  <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition text-left">
                    <span className="font-medium">Setup Two-Factor Authentication</span>
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Recommended</span>
                  </button>
                  <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition text-left">
                    <span className="font-medium">Manage Blocked Members</span>
                  </button>
                </div>
              </div>

              {/* Support & Legal */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <HelpCircle className="w-6 h-6 text-accent" />
                  <h2 className="text-xl font-bold">Support & Legal</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Docs, concierge briefings, and safety resources.</p>
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition text-left">
                    <div>
                      <p className="font-medium">Help Center</p>
                      <p className="text-xs text-muted-foreground">Guides & FAQ</p>
                    </div>
                  </button>
                  <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition text-left">
                    <div>
                      <p className="font-medium">Safety Tips</p>
                      <p className="text-xs text-muted-foreground">Playbook and escalation</p>
                    </div>
                  </button>
                  <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition text-left">
                    <span className="font-medium">Terms of Service</span>
                  </button>
                  <button className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-lg transition text-left">
                    <span className="font-medium">Privacy Policy</span>
                  </button>
                </div>
              </div>

              {/* Logout */}
              <div>
                <Button onClick={handleLogout} variant="destructive" className="w-full py-6 text-lg font-semibold">
                  <LogOut className="w-5 h-5 mr-2" />
                  Log Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {activeView === 'profile-view' && selectedProfile && (
          <div className="max-w-6xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={() => setActiveView('home')}
              className="mb-6 hover:bg-accent/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Matches
            </Button>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Photos */}
              <div className="lg:col-span-2 space-y-4">
                {/* Main Photo */}
                <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                  {(() => {
                    const photos = selectedProfile.profilePhotos || (selectedProfile.profilePhoto ? [selectedProfile.profilePhoto] : [])
                    const mainPhoto = photos[0]
                    
                    return mainPhoto ? (
                      <div className="relative w-full cursor-pointer group" style={{ paddingBottom: '75%' }} onClick={() => openPhotoGallery(photos, 0)}>
                        <img 
                          src={mainPhoto}
                          alt={selectedProfile.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm font-medium flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4" />
                          View {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
                        </div>
                        {selectedProfile.matchPercentage && (
                          <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-full px-5 py-2.5 shadow-2xl border border-white/20">
                            <span className="text-xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {selectedProfile.matchPercentage}% Match
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-8">
                          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                            {selectedProfile.name}, {selectedProfile.age}
                          </h1>
                          {selectedProfile.username && (
                            <p className="text-white/80 text-lg mb-2 drop-shadow-md">@{selectedProfile.username}</p>
                          )}
                          <div className="flex items-center gap-2 text-white/90 mb-3 drop-shadow-md">
                            <MapPin className="w-5 h-5" />
                            <span className="text-lg">{selectedProfile.city}, {selectedProfile.country}</span>
                          </div>
                          {selectedProfile.tribe && (
                            <div className="inline-block bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold border border-white/30">
                              {selectedProfile.tribe}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                        <div className="absolute inset-0 bg-linear-to-br from-primary to-accent flex items-center justify-center">
                          <span className="text-white text-9xl font-bold drop-shadow-2xl">
                            {selectedProfile.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Thumbnail Gallery */}
                {selectedProfile.profilePhotos && selectedProfile.profilePhotos.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {selectedProfile.profilePhotos.slice(1).map((photo: string, idx: number) => (
                      <div key={idx} onClick={() => openPhotoGallery(selectedProfile.profilePhotos || [], idx + 1)} className="relative bg-card border border-border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer group">
                        <div className="relative w-full" style={{ paddingBottom: '100%' }}>
                          <img 
                            src={photo}
                            alt={`${selectedProfile.name} photo ${idx + 2}`}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* About Section */}
                {selectedProfile.bio && (
                  <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold">About Me</h3>
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed">{selectedProfile.bio}</p>
                  </div>
                )}

                {/* Interests */}
                {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold">Interests</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedProfile.interests.map((interest: string, idx: number) => (
                        <span 
                          key={idx}
                          className="px-5 py-2.5 bg-linear-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-semibold border border-purple-200 hover:shadow-md transition-shadow"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Details & Actions */}
              <div className="lg:col-span-1 space-y-4">
                {/* Action Buttons */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg space-y-3 sticky top-24">
                  <Button 
                    className={`w-full h-14 text-lg font-semibold rounded-xl ${
                      isUserLiked(selectedProfile.email) 
                        ? 'bg-gray-400 cursor-default hover:bg-gray-400' 
                        : 'bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                    }`}
                    onClick={async () => {
                      if (isUserLiked(selectedProfile.email)) return
                      
                      try {
                        const response = await fetch('/api/likes/like', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json'
                          },
                          credentials: 'include',
                          body: JSON.stringify({ 
                            userId: selectedProfile.email
                          })
                        })
                        const data = await response.json()
                        if (data.success) {
                          setGlobalMessage({
                            type: 'success',
                            text: 'User liked!'
                          })
                          fetchLikesData()
                          fetchTodayMatches()
                          fetchDiscoverUsers()
                        } else {
                          setGlobalMessage({
                            type: 'error',
                            text: data.message || 'Failed to like user'
                          })
                        }
                      } catch (error) {
                        console.error('Error liking user:', error)
                        setGlobalMessage({
                          type: 'error',
                          text: 'An error occurred while liking this user'
                        })
                      }
                    }}
                    disabled={isUserLiked(selectedProfile.email)}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${isUserLiked(selectedProfile.email) ? '' : 'animate-pulse'}`} />
                    {isUserLiked(selectedProfile.email) ? 'Liked' : 'Like'}
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full h-14 text-lg font-semibold rounded-xl border-2 hover:bg-accent/10 hover:border-accent"
                    onClick={() => openChat(selectedProfile._id || selectedProfile.userId || selectedProfile.email)}
                    disabled={!selectedProfile._id && !selectedProfile.userId && !selectedProfile.email}
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Send Message
                  </Button>
                </div>

                {/* Profile Details */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 bg-linear-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold">Details</h3>
                  </div>
                  <div className="space-y-5">
                    {selectedProfile.height && (
                      <div className="flex items-start gap-3 pb-4 border-b border-border">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-purple-600 text-xs font-bold">H</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Height</h4>
                          <p className="font-semibold text-foreground">{selectedProfile.height}</p>
                        </div>
                      </div>
                    )}
                    {selectedProfile.education && (
                      <div className="flex items-start gap-3 pb-4 border-b border-border">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Education</h4>
                          <p className="font-semibold text-foreground">{selectedProfile.education}</p>
                        </div>
                      </div>
                    )}
                    {selectedProfile.occupation && (
                      <div className="flex items-start gap-3 pb-4 border-b border-border">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Occupation</h4>
                          <p className="font-semibold text-foreground">{selectedProfile.occupation}</p>
                        </div>
                      </div>
                    )}
                    {selectedProfile.religion && (
                      <div className="flex items-start gap-3 pb-4 border-b border-border">
                        <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                          <span className="text-yellow-600 text-xs font-bold">✨</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Religion</h4>
                          <p className="font-semibold text-foreground">{selectedProfile.religion}</p>
                        </div>
                      </div>
                    )}
                    {selectedProfile.maritalStatus && (
                      <div className="flex items-start gap-3 pb-4 border-b border-border">
                        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center shrink-0">
                          <Heart className="w-4 h-4 text-pink-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Marital Status</h4>
                          <p className="font-semibold text-foreground">{selectedProfile.maritalStatus}</p>
                        </div>
                      </div>
                    )}
                    {selectedProfile.lookingFor && (
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                          <Search className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Looking For</h4>
                          <p className="font-semibold text-foreground">{selectedProfile.lookingFor}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </MemberAppShell>

      {/* Referral invite modal */}
      {showReferralInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8" onClick={closeReferralInviteModal}>
          <div
            className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeReferralInviteModal}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-2 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              aria-label="Close invite modal"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pr-8">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Referral invite</p>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Send a warm welcome</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Share your code directly with a friend or guardian. We'll keep you posted as they progress.</p>
            </div>

            {referralInviteError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200">
                {referralInviteError}
              </div>
            )}

            <form onSubmit={handleReferralInviteSubmit} className="mt-5 space-y-4">
              <div className="space-y-1">
                <Label htmlFor="referral-invitee-name">Invitee name (optional)</Label>
                <Input
                  id="referral-invitee-name"
                  value={referralInviteForm.inviteeName}
                  onChange={(event) => updateReferralInviteField('inviteeName', event.target.value)}
                  placeholder="e.g. Amina N"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="referral-invitee-email">Invitee email</Label>
                <Input
                  id="referral-invitee-email"
                  type="email"
                  required
                  value={referralInviteForm.inviteeEmail}
                  onChange={(event) => updateReferralInviteField('inviteeEmail', event.target.value)}
                  placeholder="friend@example.com"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="referral-guardian-email">Guardian email (optional)</Label>
                <Input
                  id="referral-guardian-email"
                  type="email"
                  value={referralInviteForm.guardianEmail}
                  onChange={(event) => updateReferralInviteField('guardianEmail', event.target.value)}
                  placeholder="elder@family.com"
                />
                <p className="text-xs text-slate-500">We loop guardians in with a respectful invite so they can approve the match.</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="referral-message">Personal message (optional)</Label>
                <Textarea
                  id="referral-message"
                  rows={4}
                  value={referralInviteForm.message}
                  onChange={(event) => updateReferralInviteField('message', event.target.value)}
                  placeholder="Share why Tribal Mingle could be a great fit for them."
                />
                <p className="text-xs text-slate-500">Max 500 characters</p>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={closeReferralInviteModal}>Cancel</Button>
                <Button type="submit" disabled={referralInviteSubmitting}>
                  {referralInviteSubmitting ? 'Sending…' : 'Send invite'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Gallery Modal */}
      {showPhotoGallery && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onKeyDown={(e) => {
            if (e.key === 'Escape') closePhotoGallery()
            if (e.key === 'ArrowLeft') prevPhoto()
            if (e.key === 'ArrowRight') nextPhoto()
          }}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={closePhotoGallery}
            className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-3 rounded-full transition-all active:scale-95"
            aria-label="Close gallery"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Photo Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium">
            {currentPhotoIndex + 1} / {galleryPhotos.length}
          </div>

          {/* Previous Button */}
          {galleryPhotos.length > 1 && (
            <button
              onClick={prevPhoto}
              className="absolute left-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-4 rounded-full transition-all active:scale-95"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main Image */}
          <div className="relative max-w-6xl max-h-screen w-full h-full flex items-center justify-center p-4">
            <img
              src={galleryPhotos[currentPhotoIndex]}
              alt={`Photo ${currentPhotoIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>

          {/* Next Button */}
          {galleryPhotos.length > 1 && (
            <button
              onClick={nextPhoto}
              className="absolute right-4 z-50 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white p-4 rounded-full transition-all active:scale-95"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Thumbnail Strip (Mobile Hidden) */}
          {galleryPhotos.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 hidden md:flex gap-2 max-w-4xl overflow-x-auto px-4 pb-2">
              {galleryPhotos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentPhotoIndex
                      ? 'border-white shadow-lg scale-110'
                      : 'border-white/30 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

function computeWalletRegion(user?: unknown | null) {
  if (!user || typeof user !== 'object') return null

  const bag = user as Record<string, unknown>
  const candidates = [
    typeof bag.locale === 'string' ? bag.locale : undefined,
    typeof bag.country === 'string' ? bag.country : undefined,
    typeof bag.countryOfOrigin === 'string' ? bag.countryOfOrigin : undefined,
    typeof bag.city === 'string' ? bag.city : undefined,
  ]

  const normalized = candidates.find(Boolean)
  if (!normalized) {
    return null
  }

  return normalized.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

function SpaViewSwitcher({ activeView, onNavigate }: { activeView: SpaNavKey; onNavigate: (view: SpaNavKey) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {SPA_NAV_ITEMS.map((item) => (
        <Button
          key={item.id}
          size="sm"
          variant={item.id === activeView ? 'default' : 'outline'}
          onClick={() => onNavigate(item.id)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  )
}

