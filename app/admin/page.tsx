'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users, TrendingUp, DollarSign, Activity, AlertTriangle, CheckCircle, XCircle,
  Settings, LogOut, Eye, Edit2, Trash2, Search, Filter, Download, BarChart3,
  PieChart, Calendar, Mail, MessageCircle, Heart, Star, Crown, Shield,
  UserCheck, UserX, Image, Flag, Ban, UnlockKeyhole, Lock, ArrowUpRight,
  ArrowDownRight, RefreshCw, FileText, Bell, Clock, MapPin, Briefcase,
  Award, Gift, Target, TrendingDown, Zap, Phone, Globe, Smartphone, Quote,
  WalletCards, X, Sparkles, Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/premium/stat-card'
import { StaggerGrid, FadeIn, SlideUp } from '@/components/motion'
import { BOOST_AUCTION_LOCALES, BOOST_AUCTION_PLACEMENTS, type AuctionLocale, type AuctionPlacement } from '@/lib/boost/auction-constants'
import type { TrustAutomationSnapshot, TrustLivenessQueueItem } from '@/lib/trust/trust-automation-service'
import { retentionExperimentCatalog } from '@/lib/experiments/retention-suite'
import RealtimeAnalyticsPanel from './components/realtime-analytics'
import { QueueMonitorCard } from './components/queue-monitor'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  totalRevenue: number
  monthlyRevenue: number
  premiumUsers: number
  freeUsers: number
  verifiedUsers: number
  pendingVerifications: number
  totalMatches: number
  totalMessages: number
  reportedProfiles: number
  blockedUsers: number
}

interface User {
  _id: string
  email: string
  name: string
  age: number
  gender: string
  city: string
  country: string
  tribe: string
  subscriptionPlan: string
  verified: boolean
  profilePhoto: string
  createdAt: string
  lastActive: string
  status: 'active' | 'suspended' | 'banned'
  totalMatches: number
  totalMessages: number
  reportCount: number
}

interface Transaction {
  _id: string
  userId: string
  userName: string
  userEmail: string
  amount: number
  plan: string
  status: 'completed' | 'pending' | 'failed'
  date: string
}

interface Report {
  _id: string
  reportedUserId: string
  reportedUserName: string
  reporterUserId: string
  reporterUserName: string
  reason: string
  description: string
  status: 'pending' | 'reviewed' | 'resolved'
  createdAt: string
  reportedUserTribe?: string
  reportedUserCountry?: string
  reportedUserSubscriptionPlan?: string
  reportedUserStatus?: 'active' | 'suspended' | 'banned'
  totalReportsForUser?: number
}

interface AdminTestimonial {
  _id: string
  sourceType: 'user' | 'admin'
  name: string
  age?: number | null
  city?: string
  country?: string
  tribe?: string
  profilePhoto?: string
  rating?: number
  content: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt?: string
}

type SnapshotType = 'activation' | 'retention' | 'revenue' | 'trust'
type SnapshotRange = 'daily' | 'weekly' | 'monthly'

interface AnalyticsSnapshot {
  id: string | null
  type: SnapshotType
  range: SnapshotRange
  windowStart: string
  windowEnd: string
  dimensions: Record<string, string | undefined>
  metrics: Record<string, number>
  source: string
  generatedAt: string
  notes: string | null
}

interface CohortExplorerMetric {
  weekNumber: number
  retentionRate: number
  revenuePerUser: number
  notes?: string
}

interface CohortExplorerRow {
  cohortKey: string
  cohortDate: string
  dimension: string
  metrics: CohortExplorerMetric[]
}

interface CohortExplorerSummary {
  cohortCount: number
  dimension: string | null
  averageRetentionRate: number
  averageRevenuePerUser: number
  weekNumbers: number[]
}

interface CohortExplorerResult {
  rows: CohortExplorerRow[]
  summary: CohortExplorerSummary
}

interface BoostAdminWindowDetails {
  locale: string
  placement: string
  windowStart: string
  boostStartsAt: string
  boostEndsAt: string
  minBidCredits: number
  maxWinners: number
}

interface BoostAdminNextWindow {
  windowStart: string
  boostStartsAt: string
  boostEndsAt: string
  pendingCount?: number
}

interface BoostAdminBid {
  sessionId: string
  userId: string
  bidAmountCredits: number
  status: string
  auctionWindowStart: string | null
  autoRollover: boolean
  rolloverCount: number
  createdAt: string | null
  startedAt: string | null
  endsAt: string | null
}

type WalletFallbackProvider = 'stripe' | 'paystack'
type WalletProviderKey = 'applePay' | 'googlePay'
type WalletProviderEnvironment = 'test' | 'production'

interface AdminWalletProviderConfig {
  enabled?: boolean
  merchantId?: string
  merchantName?: string
  merchantCapabilities?: string[]
  supportedNetworks?: string[]
  countryCode?: string
  currencyCode?: string
  gateway?: string
  environment?: WalletProviderEnvironment
  minOSVersion?: string
}

interface AdminWalletConfig {
  _id?: string
  region: string
  currency: string
  countryCode: string
  fallbackProvider: WalletFallbackProvider
  applePay: AdminWalletProviderConfig
  googlePay: AdminWalletProviderConfig
  notes?: string
  createdAt?: string
  updatedAt?: string
}

interface WalletProviderFormState {
  enabled: boolean
  merchantId: string
  merchantName: string
  merchantCapabilities: string
  supportedNetworks: string
  countryCode: string
  currencyCode: string
  gateway: string
  environment: WalletProviderEnvironment
  minOSVersion: string
}

interface WalletConfigFormState {
  region: string
  currency: string
  countryCode: string
  fallbackProvider: WalletFallbackProvider
  notes: string
  applePay: WalletProviderFormState
  googlePay: WalletProviderFormState
}

type ModerationJobItem = {
  id: string
  prospectId: string
  email?: string
  mediaType: 'id' | 'selfie' | 'voice' | 'video'
  fileUrl: string
  aiScore?: number
  partner?: string
  status: string
  attempts: number
  createdAt: string
  uploadKey: string
  mediaStatus?: string
  mediaMessage?: string
}

type WalletProviderPayload = {
  enabled: boolean
  merchantId?: string
  merchantName?: string
  merchantCapabilities?: string[]
  supportedNetworks?: string[]
  countryCode?: string
  currencyCode?: string
  gateway?: string
  environment: WalletProviderEnvironment
  minOSVersion?: string
}

type WalletConfigPayload = {
  region: string
  currency?: string
  countryCode?: string
  fallbackProvider: WalletFallbackProvider
  notes?: string
  applePay: WalletProviderPayload
  googlePay: WalletProviderPayload
}

type ActiveTab =
  | 'dashboard'
  | 'users'
  | 'revenue'
  | 'reports'
  | 'trust'
  | 'analytics'
  | 'realtime'
  | 'boosts'
  | 'settings'
  | 'marketing'
  | 'email'
  | 'testimonials'

const COHORT_DIMENSION_OPTIONS = [
  { value: 'global', label: 'Global' },
  { value: 'country', label: 'Country' },
  { value: 'tribe', label: 'Tribe' },
  { value: 'plan', label: 'Subscription plan' },
  { value: 'acquisition', label: 'Acquisition channel' },
]

const COHORT_LIMIT_OPTIONS = [4, 8, 12, 16, 20]

const BOOST_LOCALE_LABELS: Record<AuctionLocale, string> = {
  africa_west: 'Africa · West',
  africa_east: 'Africa · East',
  diaspora_eu: 'Diaspora · Europe',
  diaspora_na: 'Diaspora · North America',
}

const BOOST_PLACEMENT_LABELS: Record<AuctionPlacement, string> = {
  spotlight: 'Spotlight',
  travel: 'Travel Mode',
  event: 'Event highlight',
}

const LIVENESS_RESOLUTION_OPTIONS: Array<{ value: 'approve' | 'reject' | 'request_reshoot'; label: string; helper: string }> = [
  {
    value: 'approve',
    label: 'Approve',
    helper: 'Everything looks good – move member forward',
  },
  {
    value: 'reject',
    label: 'Reject',
    helper: 'Clear violation or mismatch. Account will be flagged.',
  },
  {
    value: 'request_reshoot',
    label: 'Ask for reshoot',
    helper: 'Need another attempt (lighting issues, missing doc, etc.)',
  },
]

const DEFAULT_WALLET_CURRENCY = 'USD'
const DEFAULT_WALLET_COUNTRY = 'US'

function createWalletProviderFormState(config?: AdminWalletProviderConfig): WalletProviderFormState {
  return {
    enabled: Boolean(config?.enabled),
    merchantId: config?.merchantId ?? '',
    merchantName: config?.merchantName ?? '',
    merchantCapabilities: (config?.merchantCapabilities ?? []).join(', '),
    supportedNetworks: (config?.supportedNetworks ?? []).join(', '),
    countryCode: config?.countryCode ?? '',
    currencyCode: config?.currencyCode ?? '',
    gateway: config?.gateway ?? '',
    environment: config?.environment ?? 'test',
    minOSVersion: config?.minOSVersion ?? '',
  }
}

function createWalletConfigFormState(config?: AdminWalletConfig): WalletConfigFormState {
  return {
    region: config?.region ?? '',
    currency: config?.currency ?? DEFAULT_WALLET_CURRENCY,
    countryCode: config?.countryCode ?? DEFAULT_WALLET_COUNTRY,
    fallbackProvider: config?.fallbackProvider ?? 'stripe',
    notes: config?.notes ?? '',
    applePay: createWalletProviderFormState(config?.applePay),
    googlePay: createWalletProviderFormState(config?.googlePay),
  }
}

function buildWalletConfigPayload(form: WalletConfigFormState): WalletConfigPayload {
  return {
    region: form.region.trim(),
    currency: normalizeIsoValue(form.currency, 3),
    countryCode: normalizeIsoValue(form.countryCode, 2),
    fallbackProvider: form.fallbackProvider,
    notes: form.notes.trim() || undefined,
    applePay: buildWalletProviderPayload(form.applePay),
    googlePay: buildWalletProviderPayload(form.googlePay),
  }
}

function buildWalletProviderPayload(form: WalletProviderFormState): WalletProviderPayload {
  const capabilities = parseCommaSeparatedList(form.merchantCapabilities)
  const networks = parseCommaSeparatedList(form.supportedNetworks)

  return {
    enabled: form.enabled,
    merchantId: form.merchantId.trim() || undefined,
    merchantName: form.merchantName.trim() || undefined,
    merchantCapabilities: capabilities.length ? capabilities : undefined,
    supportedNetworks: networks.length ? networks : undefined,
    countryCode: normalizeIsoValue(form.countryCode, 2),
    currencyCode: normalizeIsoValue(form.currencyCode, 3),
    gateway: form.gateway.trim() || undefined,
    environment: form.environment,
    minOSVersion: form.minOSVersion.trim() || undefined,
  }
}

function parseCommaSeparatedList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeIsoValue(value: string, expectedLength: number) {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }
  if (trimmed.length === expectedLength || trimmed.length === 0) {
    return trimmed.toUpperCase()
  }
  return trimmed.slice(0, expectedLength).toUpperCase()
}

export default function AdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterTribe, setFilterTribe] = useState('all')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminUser, setAdminUser] = useState<{ email: string; role: string } | null>(null)
  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([])
  const [loadingTestimonials, setLoadingTestimonials] = useState(false)
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    age: '',
    city: '',
    country: '',
    tribe: '',
    rating: '5',
    content: ''
  })
  
  // Data states
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    premiumUsers: 0,
    freeUsers: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    totalMatches: 0,
    totalMessages: 0,
    reportedProfiles: 0,
    blockedUsers: 0
  })
  
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [analyticsSnapshots, setAnalyticsSnapshots] = useState<AnalyticsSnapshot[]>([])
  const [snapshotType, setSnapshotType] = useState<SnapshotType>('activation')
  const [snapshotRange, setSnapshotRange] = useState<SnapshotRange>('daily')
  const [snapshotLoading, setSnapshotLoading] = useState(false)
  const [snapshotError, setSnapshotError] = useState<string | null>(null)
  const [trustSnapshot, setTrustSnapshot] = useState<TrustAutomationSnapshot | null>(null)
  const [trustLoading, setTrustLoading] = useState(false)
  const [trustError, setTrustError] = useState<string | null>(null)
  const [trustActionMessage, setTrustActionMessage] = useState<string | null>(null)
  const [selectedLivenessItem, setSelectedLivenessItem] = useState<TrustLivenessQueueItem | null>(null)
  const [livenessResolution, setLivenessResolution] = useState<'approve' | 'reject' | 'request_reshoot'>('approve')
  const [livenessReviewNote, setLivenessReviewNote] = useState('')
  const [livenessReviewLoading, setLivenessReviewLoading] = useState(false)
  const [livenessReviewError, setLivenessReviewError] = useState<string | null>(null)
  const [moderationJobs, setModerationJobs] = useState<ModerationJobItem[]>([])
  const [moderationLoading, setModerationLoading] = useState(false)
  const [moderationError, setModerationError] = useState<string | null>(null)
  const [moderationActionId, setModerationActionId] = useState<string | null>(null)
  const [cohortData, setCohortData] = useState<CohortExplorerResult | null>(null)
  const [cohortDimension, setCohortDimension] = useState('global')
  const [cohortLimit, setCohortLimit] = useState(8)
  const [cohortLoading, setCohortLoading] = useState(false)
  const [cohortError, setCohortError] = useState<string | null>(null)
  const [boostLocale, setBoostLocale] = useState<AuctionLocale>(BOOST_AUCTION_LOCALES[0])
  const [boostPlacement, setBoostPlacement] = useState<AuctionPlacement>(BOOST_AUCTION_PLACEMENTS[0])
  const [boostWindow, setBoostWindow] = useState<BoostAdminWindowDetails | null>(null)
  const [boostNextWindow, setBoostNextWindow] = useState<BoostAdminNextWindow | null>(null)
  const [boostPendingBids, setBoostPendingBids] = useState<BoostAdminBid[]>([])
  const [boostNextWindowBids, setBoostNextWindowBids] = useState<BoostAdminBid[]>([])
  const [boostActiveSessions, setBoostActiveSessions] = useState<BoostAdminBid[]>([])
  const [boostLoading, setBoostLoading] = useState(false)
  const [boostError, setBoostError] = useState<string | null>(null)
  const [boostActionLoading, setBoostActionLoading] = useState(false)
  const [boostActionMessage, setBoostActionMessage] = useState<string | null>(null)
  const [walletConfigs, setWalletConfigs] = useState<AdminWalletConfig[]>([])
  const [walletConfigsLoading, setWalletConfigsLoading] = useState(false)
  const [walletConfigsError, setWalletConfigsError] = useState<string | null>(null)
  const [walletConfigForm, setWalletConfigForm] = useState<WalletConfigFormState>(() => createWalletConfigFormState())
  const [walletConfigMessage, setWalletConfigMessage] = useState<string | null>(null)
  const [walletConfigFormError, setWalletConfigFormError] = useState<string | null>(null)
  const [walletConfigSubmitting, setWalletConfigSubmitting] = useState(false)
  const [editingWalletRegion, setEditingWalletRegion] = useState<string | null>(null)

  // Basic client-side admin guard.
  // NOTE: This ONLY checks a localStorage flag and must be backed by real
  // authentication/authorization on the API routes (e.g. checking a signed
  // admin JWT or session token against env-configured admin accounts).
  useEffect(() => {
    async function verifyAdmin() {
      try {
        const response = await fetch('/api/admin/session', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('unauthorized')
        }
        const data = await response.json()
        setAdminUser(data.admin)
        setIsAuthenticated(true)
        fetchDashboardData()
      } catch (error) {
        console.warn('Admin session missing', error)
        router.push('/admin/login')
      }
    }

    verifyAdmin()
  }, [router])


  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats')
      const statsData = await statsResponse.json()
      if (statsData.success) setStats(statsData.stats)

      // Fetch users
      const usersResponse = await fetch('/api/admin/users')
      const usersData = await usersResponse.json()
      if (usersData.success) setUsers(usersData.users)

      // Fetch transactions
      const transactionsResponse = await fetch('/api/admin/transactions')
      const transactionsData = await transactionsResponse.json()
      if (transactionsData.success) setTransactions(transactionsData.transactions)

  // Fetch reports
      const reportsResponse = await fetch('/api/admin/reports')
      const reportsData = await reportsResponse.json()
      if (reportsData.success) setReports(reportsData.reports)

  // Fetch testimonials
  await fetchTestimonials()
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchWalletConfigs = useCallback(async () => {
    setWalletConfigsLoading(true)
    setWalletConfigsError(null)
    try {
      const response = await fetch('/api/payments/wallet-config')
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load wallet configurations')
      }
      if (Array.isArray(data.configs)) {
        setWalletConfigs(data.configs)
      } else if (data.config) {
        setWalletConfigs([data.config])
      } else {
        setWalletConfigs([])
      }
    } catch (error) {
      console.error('Error fetching wallet configs:', error)
      setWalletConfigsError(error instanceof Error ? error.message : 'Unable to load wallet configurations')
    } finally {
      setWalletConfigsLoading(false)
    }
  }, [])

  const fetchAnalyticsSnapshots = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (activeTab !== 'analytics') {
        return
      }

      setSnapshotLoading(true)
      setSnapshotError(null)

      try {
        const params = new URLSearchParams({
          type: snapshotType,
          range: snapshotRange,
          limit: '6',
        })

        if (options?.refresh) {
          params.set('refresh', 'true')
        }

        const response = await fetch(`/api/admin/analytics/snapshots?${params.toString()}`)
        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Unable to load analytics snapshots')
        }

        setAnalyticsSnapshots(Array.isArray(data.snapshots) ? data.snapshots : [])
      } catch (error) {
        console.error('Error fetching analytics snapshots:', error)
        setSnapshotError(error instanceof Error ? error.message : 'Failed to load analytics snapshots')
      } finally {
        setSnapshotLoading(false)
      }
    },
    [activeTab, snapshotRange, snapshotType],
  )

  const fetchCohortExplorer = useCallback(async () => {
    if (activeTab !== 'analytics') {
      return
    }

    setCohortLoading(true)
    setCohortError(null)

    try {
      const params = new URLSearchParams()

      if (cohortDimension && cohortDimension !== 'global') {
        params.set('dimension', cohortDimension)
      }

      params.set('limit', cohortLimit.toString())

      const queryString = params.toString()
      const response = await fetch(queryString ? `/api/admin/analytics/cohorts?${queryString}` : '/api/admin/analytics/cohorts')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load cohort analytics')
      }

      setCohortData(data.cohorts as CohortExplorerResult)
    } catch (error) {
      console.error('Error fetching cohort analytics:', error)
      setCohortError(error instanceof Error ? error.message : 'Failed to load cohort analytics')
    } finally {
      setCohortLoading(false)
    }
  }, [activeTab, cohortDimension, cohortLimit])

  const startWalletConfigEdit = useCallback((config?: AdminWalletConfig) => {
    setWalletConfigForm(createWalletConfigFormState(config))
    setEditingWalletRegion(config?.region ?? null)
    setWalletConfigFormError(null)
  }, [])

  const updateWalletConfigField = (field: 'region' | 'currency' | 'countryCode' | 'fallbackProvider' | 'notes', value: string) => {
    setWalletConfigForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const updateWalletProviderField = (provider: WalletProviderKey, field: keyof WalletProviderFormState, value: string | boolean) => {
    setWalletConfigForm((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }))
  }

  const handleWalletConfigSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setWalletConfigFormError(null)

    if (!walletConfigForm.region.trim()) {
      setWalletConfigFormError('Region is required')
      return
    }

    setWalletConfigSubmitting(true)
    try {
      const payload = buildWalletConfigPayload(walletConfigForm)
      const response = await fetch('/api/payments/wallet-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        const validationError = data?.errors ? (Object.values(data.errors).flat().find(Boolean) as string | undefined) : null
        throw new Error(validationError || data.error || 'Unable to save wallet configuration')
      }

      setWalletConfigMessage(`Wallet region ${data.config.region.toUpperCase()} saved successfully`)
      setEditingWalletRegion(data.config.region)
      setWalletConfigForm(createWalletConfigFormState(data.config))
      await fetchWalletConfigs()
    } catch (error) {
      console.error('Error saving wallet configuration:', error)
      setWalletConfigFormError(error instanceof Error ? error.message : 'Unable to save wallet configuration')
    } finally {
      setWalletConfigSubmitting(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'revenue') {
      fetchWalletConfigs()
    }
  }, [activeTab, fetchWalletConfigs])

  useEffect(() => {
    if (!walletConfigMessage) {
      return
    }

    const timeout = setTimeout(() => setWalletConfigMessage(null), 5000)
    return () => clearTimeout(timeout)
  }, [walletConfigMessage])

  const fetchTrustAutomationSnapshot = useCallback(async (options?: { force?: boolean }) => {
    if (!options?.force && activeTab !== 'trust') {
      return
    }

    setTrustLoading(true)
    setTrustError(null)

    try {
      const response = await fetch('/api/admin/trust/automation')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load trust automation data')
      }

      setTrustSnapshot(data.snapshot as TrustAutomationSnapshot)
    } catch (error) {
      console.error('Error fetching trust automation snapshot:', error)
      setTrustError(error instanceof Error ? error.message : 'Failed to load trust automation data')
    } finally {
      setTrustLoading(false)
    }
  }, [activeTab])

  const fetchModerationJobs = useCallback(async () => {
    if (activeTab !== 'trust') {
      return
    }

    setModerationLoading(true)
    setModerationError(null)

    try {
      const response = await fetch('/api/admin/moderation/jobs?limit=25')
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load verification queue')
      }

      setModerationJobs(Array.isArray(data.items) ? data.items : [])
    } catch (error) {
      console.error('Error fetching moderation jobs:', error)
      setModerationError(error instanceof Error ? error.message : 'Failed to load verification queue')
      setModerationJobs([])
    } finally {
      setModerationLoading(false)
    }
  }, [activeTab])

  const fetchBoostAdminWindow = useCallback(async () => {
    if (activeTab !== 'boosts') {
      return
    }

    setBoostLoading(true)
    setBoostError(null)

    try {
      const params = new URLSearchParams({
        locale: boostLocale,
        placement: boostPlacement,
      })

      const response = await fetch(`/api/boosts/admin/window?${params.toString()}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to load boost auction data')
      }

      setBoostWindow(data.window ?? null)
      setBoostNextWindow(data.nextWindow ?? null)
      setBoostPendingBids(Array.isArray(data.pendingBids) ? data.pendingBids : [])
      setBoostNextWindowBids(Array.isArray(data.nextWindowBids) ? data.nextWindowBids : [])
      setBoostActiveSessions(Array.isArray(data.activeSessions) ? data.activeSessions : [])
    } catch (error) {
      console.error('Error fetching boost auction window:', error)
      setBoostError(error instanceof Error ? error.message : 'Failed to load boost auction data')
    } finally {
      setBoostLoading(false)
    }
  }, [activeTab, boostLocale, boostPlacement])

  const openLivenessReviewModal = (item: TrustLivenessQueueItem) => {
    setSelectedLivenessItem(item)
    setLivenessResolution('approve')
    setLivenessReviewNote('')
    setLivenessReviewError(null)
  }

  const closeLivenessReviewModal = () => {
    setSelectedLivenessItem(null)
    setLivenessReviewNote('')
    setLivenessReviewError(null)
    setLivenessReviewLoading(false)
  }

  const handleSubmitLivenessReview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedLivenessItem?.sessionToken) {
      setLivenessReviewError('Missing session token for this review. Ask engineering to investigate the trust event payload.')
      return
    }

    const note = livenessReviewNote.trim()
    const payload: { resolution: 'approve' | 'reject' | 'request_reshoot'; note?: string } = {
      resolution: livenessResolution,
    }
    if (note.length > 0) {
      payload.note = note
    }

    setLivenessReviewLoading(true)
    setLivenessReviewError(null)

    try {
      const response = await fetch(`/api/trust/liveness/session/${selectedLivenessItem.sessionToken}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        const validationMessage = data?.errors ? (Object.values(data.errors).flat().find(Boolean) as string | undefined) : null
        throw new Error(validationMessage || data?.message || 'Unable to record review')
      }

      closeLivenessReviewModal()
      setTrustActionMessage('Manual review recorded successfully.')
      await fetchTrustAutomationSnapshot({ force: true })
    } catch (error) {
      console.error('Error submitting liveness manual review:', error)
      setLivenessReviewError(error instanceof Error ? error.message : 'Unable to record review')
    } finally {
      setLivenessReviewLoading(false)
    }
  }

  const handleModerationAction = async (jobId: string, resolution: 'approve' | 'reject' | 'request_reshoot') => {
    const noteInput = typeof window !== 'undefined'
      ? window.prompt('Add steward note (optional):')
      : undefined
    const note = noteInput?.trim() ? noteInput.trim() : undefined

    setModerationActionId(jobId)
    try {
      const response = await fetch(`/api/admin/moderation/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution, note }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to update moderation job')
      }

      setTrustActionMessage('Verification decision recorded successfully.')
      await fetchModerationJobs()
    } catch (error) {
      console.error('Error updating moderation job:', error)
      setModerationError(error instanceof Error ? error.message : 'Failed to update verification job')
    } finally {
      setModerationActionId(null)
    }
  }

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalyticsSnapshots()
    }
  }, [activeTab, fetchAnalyticsSnapshots])

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchCohortExplorer()
    }
  }, [activeTab, fetchCohortExplorer])

  useEffect(() => {
    if (activeTab === 'trust') {
      fetchTrustAutomationSnapshot()
    }
  }, [activeTab, fetchTrustAutomationSnapshot])

  useEffect(() => {
    if (activeTab === 'trust') {
      fetchModerationJobs()
    }
  }, [activeTab, fetchModerationJobs])

  useEffect(() => {
    if (activeTab === 'boosts') {
      fetchBoostAdminWindow()
    }
  }, [activeTab, fetchBoostAdminWindow])

  const handleUserAction = async (userId: string, action: 'verify' | 'suspend' | 'ban' | 'delete') => {
    if (!confirm(`Are you sure you want to ${action} this user?`)) return

    try {
      const response = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      })

      const data = await response.json()
      if (data.success) {
        console.log(`User ${action}ed successfully`)
        fetchDashboardData()
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
    }
  }

  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss', note?: string) => {
    try {
      const response = await fetch('/api/admin/report-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, action, note })
      })

      const data = await response.json()
      if (data.success) {
        console.log(`Report ${action}d successfully`)
        fetchDashboardData()
      }
    } catch (error) {
      console.error(`Error ${action}ing report:`, error)
    }
  }

  const handleForceClearAuctionWindow = async () => {
    if (!boostLocale || !boostPlacement) {
      return
    }

    if (!confirm('Force clear this boost auction window? This will activate top bids immediately.')) {
      return
    }

    setBoostActionLoading(true)
    setBoostActionMessage(null)

    try {
      const response = await fetch('/api/boosts/admin/window', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: boostLocale,
          placement: boostPlacement,
          windowStart: boostWindow?.windowStart,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Unable to clear boost auction window')
      }

      const clearedWindowStart = data.result?.windowStart ?? boostWindow?.windowStart
      setBoostActionMessage(`Cleared auction window starting ${formatDateTime(clearedWindowStart)}`)
      await fetchBoostAdminWindow()
    } catch (error) {
      console.error('Error clearing auction window:', error)
      setBoostError(error instanceof Error ? error.message : 'Failed to clear boost auction window')
    } finally {
      setBoostActionLoading(false)
    }
  }

  const fetchTestimonials = async () => {
    try {
      setLoadingTestimonials(true)
      const res = await fetch('/api/admin/testimonials')
      const data = await res.json()
      if (data.success && Array.isArray(data.testimonials)) {
        setTestimonials(data.testimonials)
      }
    } catch (error) {
      console.error('Error fetching admin testimonials:', error)
    } finally {
      setLoadingTestimonials(false)
    }
  }

  const updateTestimonialStatus = async (id: string, status: 'approved' | 'rejected' | 'pending') => {
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, status })
      })
      const data = await res.json()
      if (data.success) {
        fetchTestimonials()
      }
    } catch (error) {
      console.error('Error updating testimonial status:', error)
    }
  }

  const handleCreateAdminTestimonial = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTestimonial.content.trim() || !newTestimonial.name.trim()) return

    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTestimonial.name.trim(),
          age: newTestimonial.age ? Number(newTestimonial.age) : undefined,
          city: newTestimonial.city.trim() || undefined,
          country: newTestimonial.country.trim() || undefined,
          tribe: newTestimonial.tribe.trim() || undefined,
          rating: Number(newTestimonial.rating) || 5,
          content: newTestimonial.content.trim()
        })
      })
      const data = await res.json()
      if (data.success) {
        setNewTestimonial({
          name: '',
          age: '',
          city: '',
          country: '',
          tribe: '',
          rating: '5',
          content: ''
        })
        fetchTestimonials()
      }
    } catch (error) {
      console.error('Error creating admin testimonial:', error)
    }
  }

  const exportData = (type: 'users' | 'transactions' | 'reports') => {
    let data: any[] = []
    let filename = ''

    switch (type) {
      case 'users':
        data = users
        filename = 'users_export.json'
        break
      case 'transactions':
        data = transactions
        filename = 'transactions_export.json'
        break
      case 'reports':
        data = reports
        filename = 'reports_export.json'
        break
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      filterStatus === 'all' ||
      user.subscriptionPlan === filterStatus ||
      user.status === filterStatus

    const matchesCountry =
      filterCountry === 'all' ||
      user.country.toLowerCase() === filterCountry.toLowerCase()

    const matchesTribe =
      filterTribe === 'all' ||
      (user.tribe || '').toLowerCase() === filterTribe.toLowerCase()

    return matchesSearch && matchesStatus && matchesCountry && matchesTribe
  })

  const latestSnapshot = analyticsSnapshots[0] ?? null
  const latestSnapshotMetrics = latestSnapshot ? Object.entries(latestSnapshot.metrics) : []
  const snapshotColumns = latestSnapshot ? Object.keys(latestSnapshot.metrics).slice(0, 4) : []
  const cohortWeekNumbers = cohortData?.summary.weekNumbers ?? []

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-royal border-t-gold-warm rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const handleAdminLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) {
      return
    }

    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <div className="min-h-screen flex relative">
      {/* Premium background effects */}
      <div className="fixed inset-0 -z-50 bg-hero-gradient">
        <div className="absolute top-20 left-20 w-48 h-48 md:w-96 md:h-96 bg-purple-royal/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gold-warm/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-royal/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      {/* Grid overlay */}
      <div className="fixed inset-0 -z-40 bg-[url('/grid.svg')] opacity-10" />
      
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Premium Sidebar */}
      <div className={`w-64 bg-card/60 backdrop-blur-md border-r border-border-gold/20 fixed h-full overflow-y-auto z-50 transition-transform duration-300 lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:block`}>
        <div className="bg-gradient-to-br from-purple-royal via-purple-royal/90 to-purple-royal/80 p-4 lg:p-6">
          <div className="flex flex-col items-center mb-6 lg:mb-8">
            <img src="/triballogo.png" alt="Tribal Mingle" className="w-full h-auto max-w-[180px] mb-0" />
            <h1 className="text-lg lg:text-xl font-bold text-white font-display">Admin Panel</h1>
            <Badge variant="gold" className="mt-2 text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Premium Access
            </Badge>
            <p className="mt-2 text-xs text-white/70 text-center">Trusted staff only</p>
          </div>
        </div>
        <div className="p-4 lg:p-6">

          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'User Management', icon: Users },
              { id: 'revenue', label: 'Revenue & Billing', icon: DollarSign },
              { id: 'reports', label: 'Reports & Flags', icon: Flag },
              { id: 'trust', label: 'Trust & Safety', icon: Shield },
              { id: 'testimonials', label: 'Testimonials', icon: Quote },
              { id: 'analytics', label: 'Insights', icon: TrendingUp },
              { id: 'realtime', label: 'Real-Time Analytics', icon: Activity },
              { id: 'boosts', label: 'Boost Auctions', icon: ArrowUpRight },
              { id: 'marketing', label: 'Marketing', icon: Target },
              { id: 'email', label: 'Email Users', icon: Mail },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as ActiveTab)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg transition-all duration-300 text-sm lg:text-base ${
                    activeTab === tab.id
                      ? 'bg-purple-royal/20 text-purple-royal font-semibold border border-purple-royal/40 backdrop-blur-sm'
                      : 'text-text-secondary hover:bg-background-tertiary/50 hover:text-text-primary backdrop-blur-sm'
                  }`}
                >
                  <Icon className="w-4 h-4 lg:w-5 lg:h-5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-4 lg:p-6 border-t border-border-gold/20 space-y-2">
          <button
            onClick={() => router.push('/dashboard-spa')}
            className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-text-secondary hover:bg-background-tertiary/50 hover:text-text-primary rounded-lg transition-all backdrop-blur-sm text-sm lg:text-base"
          >
            <Users className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="truncate">User Dashboard</span>
          </button>
          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-all backdrop-blur-sm text-sm lg:text-base"
          >
            <LogOut className="w-4 h-4 lg:w-5 lg:h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 flex-1 p-4 sm:p-6 lg:p-8 w-full">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 -mx-4 sm:-mx-6 mb-4 sm:mb-6 px-4 sm:px-6 py-3 bg-card/60 backdrop-blur-md border-b border-border-gold/20">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-royal/10 text-purple-royal hover:bg-purple-royal/20 transition-all"
            >
              <Menu className="w-5 h-5" />
              <span className="text-sm font-semibold">Menu</span>
            </button>
            <div className="flex items-center gap-2">
              <img src="/triballogo.png" alt="Tribal Mingle" className="h-8 w-auto" />
            </div>
            <Badge variant="gold" className="text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </div>
        </div>
        {/* DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div>
            <SlideUp>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-display-sm font-display text-text-primary">Dashboard Overview</h1>
                  <p className="text-body text-text-secondary mt-1">Monitor your platform performance</p>
                </div>
                <Button onClick={fetchDashboardData} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </SlideUp>

            {/* Key Stats */}
            <StaggerGrid columns={4}>
              <StatCard
                icon={<Users className="w-5 h-5" />}
                title="Total Users"
                value={stats.totalUsers}
                trend={stats.newUsersToday > 0 ? ((stats.newUsersToday / stats.totalUsers) * 100) : 0}
                trendLabel={`+${stats.newUsersToday} today`}
                variant="glass"
              />
              <StatCard
                icon={<DollarSign className="w-5 h-5" />}
                title="Monthly Revenue"
                value={stats.monthlyRevenue}
                prefix="£"
                trend={12}
                trendLabel="vs last month"
                variant="glass"
              />
              <StatCard
                icon={<Activity className="w-5 h-5" />}
                title="Active Users"
                value={stats.activeUsers}
                trend={((stats.activeUsers / stats.totalUsers) * 100)}
                trendLabel="engagement rate"
                variant="glass"
              />
              <StatCard
                icon={<AlertTriangle className="w-5 h-5" />}
                title="Pending Reports"
                value={stats.reportedProfiles}
                trend={stats.reportedProfiles > 5 ? -10 : 5}
                trendLabel={stats.reportedProfiles > 5 ? 'Needs attention' : 'Under control'}
                variant="glass"
              />
            </StaggerGrid>

            {/* Additional Metrics */}
            <FadeIn delay={0.3}>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 mt-8">
                <Card variant="glass" className="p-6">
                  <h3 className="text-h3 font-display text-text-primary mb-4">Subscription Breakdown</h3>
                  <div className="space-y-4">{[
                      { plan: 'Free', count: stats.freeUsers, color: 'bg-text-tertiary', percentage: (stats.freeUsers / stats.totalUsers) * 100 },
                      { plan: 'Monthly', count: Math.floor(stats.premiumUsers * 0.4), color: 'bg-blue-500', percentage: (Math.floor(stats.premiumUsers * 0.4) / stats.totalUsers) * 100 },
                      { plan: '3 Months', count: Math.floor(stats.premiumUsers * 0.35), color: 'bg-purple-royal', percentage: (Math.floor(stats.premiumUsers * 0.35) / stats.totalUsers) * 100 },
                      { plan: '6 Months', count: Math.floor(stats.premiumUsers * 0.25), color: 'bg-gold-warm', percentage: (Math.floor(stats.premiumUsers * 0.25) / stats.totalUsers) * 100 }
                    ].map((item, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-text-secondary font-medium">{item.plan}</span>
                          <span className="text-text-primary font-semibold">{item.count} ({item.percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-background-tertiary rounded-full h-2">
                          <div className={`${item.color} h-2 rounded-full transition-all duration-1000`} style={{ width: `${item.percentage}%` }}></div>
                        </div>
                      </div>
                  ))}
                </div>
              </Card>

              <Card variant="glass" className="p-6">
                <h3 className="text-h3 font-display text-text-primary mb-4">Platform Activity</h3>
                <div className="space-y-3">{[
                    { label: 'Total Matches', value: stats.totalMatches, icon: Heart, color: 'text-red-500' },
                    { label: 'Messages Sent', value: stats.totalMessages, icon: MessageCircle, color: 'text-blue-500' },
                    { label: 'Verified Users', value: stats.verifiedUsers, icon: CheckCircle, color: 'text-green-500' },
                    { label: 'Pending Verifications', value: stats.pendingVerifications, icon: Clock, color: 'text-yellow-500' },
                    { label: 'Blocked Users', value: stats.blockedUsers, icon: Ban, color: 'text-red-500' }
                  ].map((item, index) => {
                    const Icon = item.icon
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${item.color}`} />
                          <span className="text-text-secondary">{item.label}</span>
                        </div>
                        <span className="text-gray-900 font-semibold">{item.value.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
              <QueueMonitorCard />
            </div>
            </FadeIn>

            {/* Recent Activity */}
            <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">Recent Registrations</h3>
              <div className="space-y-3">
                {users.slice(0, 5).map(user => (
                  <div key={user._id} className="flex items-center justify-between p-3 hover:bg-background-tertiary rounded-lg transition">
                    <div className="flex items-center gap-3">
                      {user.profilePhoto ? (
                        <img src={user.profilePhoto} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{user.name}</div>
                        <div className="text-sm text-text-tertiary">{user.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        user.subscriptionPlan === 'free' ? 'bg-background-tertiary text-text-secondary' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {user.subscriptionPlan}
                      </div>
                      <div className="text-xs text-text-tertiary mt-1">{new Date(user.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* USERS VIEW */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-text-secondary mt-1">Manage all platform users</p>
              </div>
              <Button onClick={() => exportData('users')}>
                <Download className="w-4 h-4 mr-2" />
                Export Users
              </Button>
            </div>

            {/* Filters */}
            <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-4 mb-6">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[260px]">
                  <label className="block text-xs font-semibold text-text-tertiary mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="min-w-[170px]">
                  <label className="block text-xs font-semibold text-text-tertiary mb-1">Status / Plan</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="free">Free Users</option>
                    <option value="monthly">Monthly Subscribers</option>
                    <option value="3-months">3-Month Subscribers</option>
                    <option value="6-months">6-Month Subscribers</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>

                <div className="min-w-[170px]">
                  <label className="block text-xs font-semibold text-text-tertiary mb-1">Country</label>
                  <select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="all">All Countries</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="Kenya">Kenya</option>
                    <option value="South Africa">South Africa</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>

                <div className="min-w-[170px]">
                  <label className="block text-xs font-semibold text-text-tertiary mb-1">Tribe</label>
                  <select
                    value={filterTribe}
                    onChange={(e) => setFilterTribe(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  >
                    <option value="all">All Tribes</option>
                    <option value="Igbo">Igbo</option>
                    <option value="Yoruba">Yoruba</option>
                    <option value="Hausa">Hausa</option>
                    <option value="Ashanti">Ashanti</option>
                    <option value="Zulu">Zulu</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-tertiary border-b border-border-gold/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Subscription</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Activity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background-secondary divide-y divide-border-gold/10">
                    {filteredUsers.map(user => (
                      <tr key={user._id} className="hover:bg-background-tertiary">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.profilePhoto ? (
                              <img src={user.profilePhoto} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {user.name.charAt(0)}
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                {user.name}
                                {user.verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                              </div>
                              <div className="text-sm text-text-tertiary">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.city}, {user.country}</div>
                          <div className="text-sm text-text-tertiary">{user.tribe}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.subscriptionPlan === 'free' ? 'bg-background-tertiary text-text-primary' :
                            user.subscriptionPlan === 'monthly' ? 'bg-blue-100 text-blue-800' :
                            user.subscriptionPlan === '3-months' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {user.subscriptionPlan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-tertiary">
                          <div>{user.totalMatches} matches</div>
                          <div>{user.totalMessages} messages</div>
                          {user.reportCount > 0 && (
                            <div className="text-red-500 font-semibold">{user.reportCount} reports</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/admin/user/${user._id}`)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {!user.verified && (
                              <button
                                onClick={() => handleUserAction(user._id, 'verify')}
                                className="text-green-600 hover:text-green-900"
                                title="Verify User"
                              >
                                <UserCheck className="w-4 h-4" />
                              </button>
                            )}
                            {user.status === 'active' && (
                              <button
                                onClick={() => handleUserAction(user._id, 'suspend')}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Suspend User"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleUserAction(user._id, 'ban')}
                              className="text-red-600 hover:text-red-900"
                              title="Ban User"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUserAction(user._id, 'delete')}
                              className="text-red-600 hover:text-red-900"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REVENUE VIEW */}
        {activeTab === 'revenue' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Revenue & Billing</h1>
                <p className="text-text-secondary mt-1">Track all financial transactions</p>
              </div>
              <Button onClick={() => exportData('transactions')}>
                <Download className="w-4 h-4 mr-2" />
                Export Transactions
              </Button>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                { label: 'Total Revenue', value: `£${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
                { label: 'This Month', value: `£${stats.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-blue-500' },
                { label: 'Premium Users', value: stats.premiumUsers.toString(), icon: Crown, color: 'bg-purple-500' }
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                    <div className={`${stat.color} p-3 rounded-lg w-fit mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-text-secondary">{stat.label}</div>
                  </div>
                )
              })}
            </div>

            {/* Wallet Providers Admin */}
            <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 mb-8">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center gap-4 justify-between">
                <div>
                  <div className="flex items-center gap-2 text-gray-900 font-semibold">
                    <WalletCards className="w-5 h-5 text-purple-600" />
                    Wallet Providers
                  </div>
                  <p className="text-sm text-text-secondary mt-1">Control Apple Pay & Google Pay availability by region</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startWalletConfigEdit(undefined)}
                  >
                    New Region
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchWalletConfigs()}
                    disabled={walletConfigsLoading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${walletConfigsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {walletConfigMessage && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start justify-between gap-3">
                    <span>{walletConfigMessage}</span>
                    <button
                      type="button"
                      onClick={() => setWalletConfigMessage(null)}
                      className="text-xs font-semibold uppercase tracking-wide"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    {walletConfigsLoading ? (
                      <p className="text-sm text-text-tertiary">Loading wallet configurations…</p>
                    ) : walletConfigsError ? (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {walletConfigsError}
                      </div>
                    ) : walletConfigs.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-text-tertiary">
                        No wallet regions configured yet. Use the form to add one.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {walletConfigs.map((config) => {
                          const appleEnabled = Boolean(config.applePay?.enabled)
                          const googleEnabled = Boolean(config.googlePay?.enabled)
                          const lastUpdated = config.updatedAt ? new Date(config.updatedAt).toLocaleString() : null
                          return (
                            <div
                              key={config.region}
                              className={`border rounded-lg p-4 transition-shadow ${
                                editingWalletRegion === config.region ? 'border-purple-500 shadow-lg' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div>
                                  <p className="text-sm font-semibold uppercase tracking-wide text-gray-900">{config.region}</p>
                                  <p className="text-xs text-text-tertiary">
                                    Currency {config.currency} · Country {config.countryCode}
                                  </p>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => startWalletConfigEdit(config)}>
                                  Edit
                                </Button>
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <p className="text-[11px] uppercase text-text-tertiary">Apple Pay</p>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full font-semibold ${
                                    appleEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {appleEnabled ? `Enabled (${config.applePay.environment})` : 'Disabled'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase text-text-tertiary">Google Pay</p>
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full font-semibold ${
                                    googleEnabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    {googleEnabled ? `Enabled (${config.googlePay.environment})` : 'Disabled'}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase text-text-tertiary">Fallback</p>
                                  <span className="font-medium text-gray-800">{config.fallbackProvider === 'stripe' ? 'Stripe' : 'Paystack'}</span>
                                </div>
                                <div>
                                  <p className="text-[11px] uppercase text-text-tertiary">Updated</p>
                                  <span className="font-medium text-gray-800">{lastUpdated || '—'}</span>
                                </div>
                              </div>
                              {config.notes && (
                                <p className="mt-3 text-xs text-text-secondary">{config.notes}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  <form className="space-y-4" onSubmit={handleWalletConfigSubmit}>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {editingWalletRegion ? `Editing ${editingWalletRegion}` : 'Create new wallet region'}
                      </p>
                      <p className="text-xs text-text-tertiary">Region keys are normalized automatically (ex: africa_west, diaspora_eu).</p>
                    </div>
                    {walletConfigFormError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {walletConfigFormError}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Region Key</label>
                      <Input
                        value={walletConfigForm.region}
                        onChange={(e) => updateWalletConfigField('region', e.target.value)}
                        placeholder="africa_west"
                        autoComplete="off"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Currency (ISO)</label>
                        <Input
                          value={walletConfigForm.currency}
                          onChange={(e) => updateWalletConfigField('currency', e.target.value.toUpperCase())}
                          placeholder="USD"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1">Country Code</label>
                        <Input
                          value={walletConfigForm.countryCode}
                          onChange={(e) => updateWalletConfigField('countryCode', e.target.value.toUpperCase())}
                          placeholder="US"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Fallback Provider</label>
                      <select
                        value={walletConfigForm.fallbackProvider}
                        onChange={(e) => updateWalletConfigField('fallbackProvider', e.target.value as WalletFallbackProvider)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="stripe">Stripe</option>
                        <option value="paystack">Paystack</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">Notes</label>
                      <textarea
                        value={walletConfigForm.notes}
                        onChange={(e) => updateWalletConfigField('notes', e.target.value)}
                        maxLength={500}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-20"
                        placeholder="Internal notes about rollout, PSP approvals, etc."
                      />
                    </div>
                    {(['applePay', 'googlePay'] as WalletProviderKey[]).map((providerKey) => {
                      const providerForm = walletConfigForm[providerKey]
                      const label = providerKey === 'applePay' ? 'Apple Pay' : 'Google Pay'
                      return (
                        <div key={providerKey} className="border border-gray-200 rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-semibold text-gray-900">
                              <Smartphone className="w-4 h-4 text-text-tertiary" />
                              {label}
                            </div>
                            <label className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                              <span>{providerForm.enabled ? 'Enabled' : 'Disabled'}</span>
                              <input
                                type="checkbox"
                                checked={providerForm.enabled}
                                onChange={(e) => updateWalletProviderField(providerKey, 'enabled', e.target.checked)}
                                className="w-4 h-4"
                              />
                            </label>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Merchant Name</label>
                              <Input
                                value={providerForm.merchantName}
                                onChange={(e) => updateWalletProviderField(providerKey, 'merchantName', e.target.value)}
                                placeholder="Tribal Mingle"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Merchant ID</label>
                              <Input
                                value={providerForm.merchantId}
                                onChange={(e) => updateWalletProviderField(providerKey, 'merchantId', e.target.value)}
                                placeholder="merchant.com.company"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Country Code</label>
                              <Input
                                value={providerForm.countryCode}
                                onChange={(e) => updateWalletProviderField(providerKey, 'countryCode', e.target.value.toUpperCase())}
                                placeholder="US"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Currency Code</label>
                              <Input
                                value={providerForm.currencyCode}
                                onChange={(e) => updateWalletProviderField(providerKey, 'currencyCode', e.target.value.toUpperCase())}
                                placeholder="USD"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Gateway</label>
                              <Input
                                value={providerForm.gateway}
                                onChange={(e) => updateWalletProviderField(providerKey, 'gateway', e.target.value)}
                                placeholder="stripe"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Environment</label>
                              <select
                                value={providerForm.environment}
                                onChange={(e) => updateWalletProviderField(providerKey, 'environment', e.target.value as 'test' | 'production')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              >
                                <option value="test">Test</option>
                                <option value="production">Production</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Merchant Capabilities</label>
                              <Input
                                value={providerForm.merchantCapabilities}
                                onChange={(e) => updateWalletProviderField(providerKey, 'merchantCapabilities', e.target.value)}
                                placeholder="supports3DS, debit"
                              />
                              <p className="text-[11px] text-text-tertiary mt-1">Comma separated list (ex: supports3DS, credit)</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Supported Networks</label>
                              <Input
                                value={providerForm.supportedNetworks}
                                onChange={(e) => updateWalletProviderField(providerKey, 'supportedNetworks', e.target.value)}
                                placeholder="visa, mastercard"
                              />
                              <p className="text-[11px] text-text-tertiary mt-1">Comma separated list (ex: visa, mastercard, amex)</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-text-secondary mb-1">Minimum OS Version</label>
                              <Input
                                value={providerForm.minOSVersion}
                                onChange={(e) => updateWalletProviderField(providerKey, 'minOSVersion', e.target.value)}
                                placeholder="16.0"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <Button type="submit" disabled={walletConfigSubmitting} className="w-full">
                      {walletConfigSubmitting ? 'Saving…' : 'Save Wallet Configuration'}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background-tertiary border-b border-border-gold/10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background-secondary divide-y divide-border-gold/10">
                    {transactions.map(transaction => (
                      <tr key={transaction._id} className="hover:bg-background-tertiary">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{transaction.userName}</div>
                          <div className="text-sm text-text-tertiary">{transaction.userEmail}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                            {transaction.plan}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          £{transaction.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-tertiary">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS VIEW */}
        {activeTab === 'reports' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports & Flags</h1>
                <p className="text-text-secondary mt-1">Review and moderate reported content</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => exportData('reports')} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Reports Grid */}
            <div className="grid gap-4">
              {reports.map(report => (
                <div key={report._id} className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-100 rounded-lg">
                        <Flag className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{report.reason}</h3>
                        <p className="text-sm text-text-secondary mt-1">Reported by: {report.reporterUserName}</p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          Reported user: <span className="font-semibold text-gray-900">{report.reportedUserName}</span>
                        </p>
                        {(report.reportedUserTribe || report.reportedUserCountry || report.reportedUserSubscriptionPlan || report.totalReportsForUser) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {report.reportedUserTribe && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-[10px] font-medium text-purple-800">
                                Tribe: {report.reportedUserTribe}
                              </span>
                            )}
                            {report.reportedUserCountry && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-medium text-blue-800">
                                Country: {report.reportedUserCountry}
                              </span>
                            )}
                            {report.reportedUserSubscriptionPlan && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-[10px] font-medium text-amber-800">
                                Plan: {report.reportedUserSubscriptionPlan}
                              </span>
                            )}
                            {typeof report.totalReportsForUser === 'number' && report.totalReportsForUser > 0 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-50 text-[10px] font-medium text-red-800">
                                {report.totalReportsForUser} prior report{report.totalReportsForUser > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      report.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>

                  <div className="bg-background-tertiary rounded-lg p-4 mb-4">
                    <p className="text-sm text-text-secondary">{report.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-text-tertiary space-y-0.5">
                      <div>
                        Created: {new Date(report.createdAt).toLocaleString()}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-background-tertiary text-[10px] font-medium text-text-secondary">
                          Reporter ID: {report.reporterUserId}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-background-tertiary text-[10px] font-medium text-text-secondary">
                          Reported ID: {report.reportedUserId}
                        </span>
                      </div>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const note = window.prompt('Optional note for dismissing this report (reason / context):') || undefined
                            handleReportAction(report._id, 'dismiss', note)
                          }}
                        >
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const note = window.prompt('Optional note for resolving this report (actions taken / rationale):') || undefined
                            handleReportAction(report._id, 'resolve', note)
                          }}
                        >
                          Take Action
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {reports.length === 0 && (
                <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-12 text-center">
                  <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports</h3>
                  <p className="text-text-secondary">All reports have been reviewed</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TESTIMONIALS VIEW */}
        {activeTab === 'testimonials' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Testimonials & Success Stories</h1>
                <p className="text-text-secondary mt-1">Curate social proof from real members and publish official Tribal Mingle success stories.</p>
              </div>
              <Button onClick={fetchTestimonials} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* List & moderation */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-900">Community stories</h2>
                  {loadingTestimonials && (
                    <span className="text-xs text-text-tertiary">Loading…</span>
                  )}
                </div>

                {testimonials.length === 0 && !loadingTestimonials && (
                  <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-8 text-center text-sm text-text-tertiary">
                    No testimonials found yet.
                  </div>
                )}

                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {testimonials.map((t) => (
                    <div
                      key={t._id}
                      className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-4 flex items-start gap-3"
                    >
                      <div className="shrink-0">
                        {t.profilePhoto ? (
                          <img
                            src={t.profilePhoto}
                            alt={t.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-semibold">
                            {t.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                              {t.name}
                              {typeof t.age === 'number' && t.age > 0 && (
                                <span className="text-text-tertiary">· {t.age}</span>
                              )}
                              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-background-tertiary text-text-secondary">
                                {t.sourceType === 'admin' ? 'Admin story' : 'Member story'}
                              </span>
                            </div>
                            <div className="text-[11px] text-text-tertiary flex items-center gap-2 mt-0.5">
                              {[t.city, t.country].filter(Boolean).join(', ') || t.tribe || 'Location not set'}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {t.rating && t.rating > 0 && (
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, idx) => {
                                  const value = idx + 1
                                  const filled = value <= (t.rating || 0)
                                  return (
                                    <Star
                                      key={value}
                                      className={`w-3 h-3 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                    />
                                  )
                                })}
                              </div>
                            )}
                            <span
                              className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full ${{
                                approved: 'bg-green-50 text-green-700 border border-green-100',
                                pending: 'bg-yellow-50 text-yellow-700 border border-yellow-100',
                                rejected: 'bg-red-50 text-red-700 border border-red-100'
                              }[t.status]}`}
                            >
                              {t.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed line-clamp-4">
                          {t.content}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-text-tertiary">
                          {t.createdAt && (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {t.status !== 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-3 border-green-500 text-green-700 hover:bg-green-50"
                              onClick={() => updateTestimonialStatus(t._id, 'approved')}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve for app
                            </Button>
                          )}
                          {t.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-3 border-red-500 text-red-700 hover:bg-red-50"
                              onClick={() => updateTestimonialStatus(t._id, 'rejected')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject story
                            </Button>
                          )}
                          {t.status !== 'pending' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs h-7 px-3 text-text-secondary hover:bg-background-tertiary"
                              onClick={() => updateTestimonialStatus(t._id, 'pending')}
                            >
                              Mark pending
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create admin testimonial */}
              <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Add Admin Story</h2>
                <p className="text-xs text-text-tertiary mb-4">
                  Create official success stories that will appear alongside user testimonials.
                </p>
                <form onSubmit={handleCreateAdminTestimonial} className="space-y-3 text-sm">
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Name *</label>
                    <Input
                      value={newTestimonial.name}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })}
                      placeholder="e.g. Chidera & Kwame"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Age</label>
                      <Input
                        type="number"
                        min={18}
                        value={newTestimonial.age}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, age: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Rating (1–5)</label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={newTestimonial.rating}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">City</label>
                      <Input
                        value={newTestimonial.city}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-secondary mb-1">Country</label>
                      <Input
                        value={newTestimonial.country}
                        onChange={(e) => setNewTestimonial({ ...newTestimonial, country: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Tribe</label>
                    <Input
                      value={newTestimonial.tribe}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, tribe: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-secondary mb-1">Story *</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[120px]"
                      value={newTestimonial.content}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                      placeholder="Describe how Tribal Mingle helped them meet, connect or build a relationship."
                    />
                    <p className="mt-1 text-[11px] text-text-tertiary">
                      Minimum 20 characters. You can anonymise names and locations if needed.
                    </p>
                  </div>
                  <Button type="submit" className="w-full mt-2">
                    <Heart className="w-4 h-4 mr-2" />
                    Publish Story
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TRUST VIEW */}
        {activeTab === 'trust' && (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Trust &amp; Safety Automation</h1>
                <p className="text-text-secondary mt-1">Monitor liveness escalations, guardian invites, and audit trails.</p>
              </div>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => fetchTrustAutomationSnapshot()}
                disabled={trustLoading}
              >
                <RefreshCw className={`w-4 h-4 ${trustLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {trustError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {trustError}
              </div>
            )}

            {trustActionMessage && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start justify-between gap-3">
                <span>{trustActionMessage}</span>
                <button
                  type="button"
                  onClick={() => setTrustActionMessage(null)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Dismiss
                </button>
              </div>
            )}

            {trustLoading && !trustSnapshot && (
              <div className="mb-6 bg-background-secondary border border-border-gold/20 rounded-xl p-6 flex items-center gap-3 text-text-secondary">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                Fetching trust automation data…
              </div>
            )}

            {trustSnapshot && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[{
                    label: 'Manual reviews queued',
                    value: trustSnapshot.livenessQueue.pendingSessions,
                    caption: `${trustSnapshot.livenessQueue.totalEvents} escalations overall`,
                    icon: Shield,
                    color: 'bg-yellow-500'
                  }, {
                    label: 'Guardian requests',
                    value: trustSnapshot.guardianInvites.pendingCount + trustSnapshot.guardianInvites.queuedCount,
                    caption: `${trustSnapshot.guardianInvites.pendingCount} awaiting triage`,
                    icon: Users,
                    color: 'bg-blue-500'
                  }, {
                    label: 'Trust signals (24h)',
                    value: trustSnapshot.trustSignals.last24hCount,
                    caption: 'Events in the last 24 hours',
                    icon: Activity,
                    color: 'bg-purple-500'
                  }].map((card, index) => {
                    const Icon = card.icon
                    return (
                      <div key={index} className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`${card.color} p-3 rounded-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <span className="text-3xl font-bold text-gray-900">{card.value.toLocaleString()}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{card.label}</p>
                        <p className="text-xs text-text-tertiary mt-1">{card.caption}</p>
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                  <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Manual review queue</h3>
                        <p className="text-sm text-text-secondary">Sessions needing human decisions.</p>
                      </div>
                      <div className="text-right text-sm text-text-tertiary">
                        <p className="font-semibold text-gray-900">{trustSnapshot.livenessQueue.pendingSessions} pending</p>
                        <p className="text-xs">{trustSnapshot.livenessQueue.totalEvents} escalations total</p>
                      </div>
                    </div>
                    {trustSnapshot.livenessQueue.items.length === 0 ? (
                      <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-text-tertiary">
                        All clear — no sessions require manual review.
                      </div>
                    ) : (
                      <div className="mt-4 divide-y divide-gray-100">
                        {trustSnapshot.livenessQueue.items.map((item) => (
                          <div key={item.id} className="py-4 flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {item.intent ? item.intent.replace(/_/g, ' ') : 'Manual review'}
                                  {item.locale && (
                                    <span className="ml-2 text-xs font-medium text-purple-700 bg-purple-50 rounded-full px-2 py-0.5">
                                      {formatLocaleTag(item.locale)}
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-text-tertiary">
                                  Session {item.sessionToken ?? '—'} · {formatRelativeTime(item.createdAt)}
                                </p>
                              </div>
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusBadgeClass(item.status)}`}>
                                {(item.status ?? 'pending').replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-secondary">
                              {item.reasons?.length ? (
                                item.reasons.map((reason) => (
                                  <span key={`${item.id}-${reason}`} className="px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                                    {reason.replace(/_/g, ' ')}
                                  </span>
                                ))
                              ) : (
                                <span className="text-text-tertiary">Provider did not supply reasons.</span>
                              )}
                              {typeof item.retryCount === 'number' && item.retryCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-background-tertiary text-text-secondary">
                                  {item.retryCount} retries
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-text-tertiary">
                              Score {formatTrustScoreDelta(item.scoreDelta)} · Aggregate {formatAggregateScore(item.aggregateScore)}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-tertiary">
                              <div className="space-x-2">
                                {item.providerDecision && (
                                  <span className="inline-flex items-center rounded-full bg-background-tertiary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                                    Provider: {item.providerDecision.replace(/_/g, ' ')}
                                  </span>
                                )}
                                {typeof item.providerConfidence === 'number' && (
                                  <span className="inline-flex items-center rounded-full bg-background-tertiary px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                                    Confidence {Math.round(item.providerConfidence * 100)}%
                                  </span>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={!item.sessionToken}
                                onClick={() => item.sessionToken ? openLivenessReviewModal(item) : null}
                              >
                                Review session
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Guardian requests</h3>
                        <p className="text-sm text-text-secondary">Family portal invites that need responses.</p>
                      </div>
                      <div className="text-right text-sm text-text-tertiary">
                        <p className="font-semibold text-gray-900">{trustSnapshot.guardianInvites.pendingCount} received</p>
                        <p className="text-xs">{trustSnapshot.guardianInvites.queuedCount} queued for follow-up</p>
                      </div>
                    </div>
                    {trustSnapshot.guardianInvites.items.length === 0 ? (
                      <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-text-tertiary">
                        No guardian outreach requests at the moment.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-4">
                        {trustSnapshot.guardianInvites.items.map((item) => (
                          <div key={item.id} className="p-4 border border-border-gold/10 rounded-lg bg-background-tertiary">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{item.memberName}</p>
                                <p className="text-xs text-text-tertiary">{item.contact}</p>
                              </div>
                              <div className="text-right text-xs text-text-tertiary">
                                <p className="font-semibold text-text-secondary">{item.locale.toUpperCase()}</p>
                                <p>{formatRelativeTime(item.createdAt)}</p>
                              </div>
                            </div>
                            <p className="text-xs text-text-tertiary mt-2">
                              Status {item.status} · Source {item.source}{item.regionHint ? ` · ${item.regionHint}` : ''}
                            </p>
                            {item.context && (
                              <p className="text-sm text-text-secondary mt-2">{item.context}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                  <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Recent trust signals</h3>
                    {trustSnapshot.trustSignals.items.length === 0 ? (
                      <p className="text-sm text-text-tertiary">No trust events recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-text-tertiary">
                              <th className="pb-2 pr-4">Event</th>
                              <th className="pb-2 pr-4">Score</th>
                              <th className="pb-2 pr-4">Aggregate</th>
                              <th className="pb-2 pr-4">Timestamp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trustSnapshot.trustSignals.items.map((event) => (
                              <tr key={event.id} className="border-t border-border-gold/10">
                                <td className="py-2 pr-4">
                                  <p className="font-semibold text-gray-900 text-xs">{event.eventType.replace(/_/g, ' ')}</p>
                                  <p className="text-xs text-text-tertiary">Source {event.source}</p>
                                </td>
                                <td className="py-2 pr-4 text-sm font-semibold text-gray-900">
                                  {formatTrustScoreDelta(event.scoreDelta)}
                                </td>
                                <td className="py-2 pr-4 text-sm text-gray-900">{formatAggregateScore(event.aggregateScore)}</td>
                                <td className="py-2 pr-4 text-xs text-text-tertiary">{formatRelativeTime(event.createdAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                    <h3 className="text-lg font-bold text-text-primary mb-4">Latest audit trail</h3>
                    {trustSnapshot.activityLogs.items.length === 0 ? (
                      <p className="text-sm text-text-tertiary">No activity has been logged yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {trustSnapshot.activityLogs.items.map((log) => (
                          <div key={log.id} className="border border-border-gold/10 rounded-lg p-4 bg-background-tertiary">
                            <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                            <p className="text-xs text-text-tertiary mt-1">
                              {log.resource.collection}
                              {log.resource.id ? ` · ${log.resource.id}` : ''}
                            </p>
                            <p className="text-xs text-text-tertiary mt-1">{formatRelativeTime(log.createdAt)}</p>
                            {log.metadata && (
                              <pre className="mt-2 text-[11px] text-text-secondary bg-background-tertiary rounded-md p-2 overflow-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Verification media queue</h3>
                      <p className="text-sm text-text-secondary">Review ID + selfie uploads and approve them manually.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {moderationError && (
                        <span className="text-xs text-red-600">{moderationError}</span>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchModerationJobs()}
                        disabled={moderationLoading}
                        className="w-full md:w-auto"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${moderationLoading ? 'animate-spin' : ''}`} />
                        Refresh queue
                      </Button>
                    </div>
                  </div>

                  {moderationLoading && (
                    <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-text-tertiary">
                      Loading verification jobs…
                    </div>
                  )}

                  {!moderationLoading && moderationJobs.length === 0 && (
                    <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-text-tertiary">
                      All identity uploads are reviewed. New submissions will show up here automatically.
                    </div>
                  )}

                  {moderationJobs.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {moderationJobs.map((job) => {
                        const aiScoreLabel = formatAiScoreLabel(job.aiScore)
                        return (
                        <div key={job.id} className="border border-border-gold/10 rounded-xl p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {formatMediaTypeLabel(job.mediaType)}
                                {job.email && (
                                  <span className="ml-2 text-xs text-text-tertiary">· {job.email}</span>
                                )}
                              </p>
                              <p className="text-xs text-text-tertiary">{formatRelativeTimeSafe(job.createdAt)}</p>
                            </div>
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-50 text-yellow-700">
                              {job.status}
                            </span>
                          </div>

                          <div className="mt-3 rounded-lg bg-background-tertiary p-3">
                            {job.mediaType === 'voice' ? (
                              <audio controls src={job.fileUrl} className="w-full" />
                            ) : job.mediaType === 'video' ? (
                              <video controls src={job.fileUrl} className="w-full max-h-64 rounded-lg" />
                            ) : (
                              <img src={job.fileUrl} alt={`${job.mediaType} upload`} className="w-full max-h-64 object-contain rounded-lg" />
                            )}
                            <div className="mt-2 flex items-center justify-between text-xs text-text-tertiary">
                              <span>Upload key {job.uploadKey.slice(0, 6)}…</span>
                              <a href={job.fileUrl} target="_blank" rel="noreferrer" className="text-purple-600 font-semibold">
                                Open original
                              </a>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-text-secondary">
                            {aiScoreLabel && (
                              <span className="inline-flex items-center rounded-full bg-background-tertiary px-2 py-0.5 border border-border-gold/20 text-text-secondary">
                                {aiScoreLabel}
                              </span>
                            )}
                            {job.partner && (
                              <span className="inline-flex items-center rounded-full bg-background-tertiary px-2 py-0.5 border border-border-gold/20 text-text-secondary">
                                Partner {job.partner}
                              </span>
                            )}
                            <span className="inline-flex items-center rounded-full bg-background-tertiary px-2 py-0.5 border border-border-gold/20 text-text-secondary">
                              Attempts {job.attempts}
                            </span>
                            <span className="inline-flex items-center rounded-full bg-background-tertiary px-2 py-0.5 border border-border-gold/20 text-text-secondary">
                              Prospect {job.prospectId.slice(0, 6)}…
                            </span>
                            {job.mediaStatus && (
                              <span className="inline-flex items-center rounded-full bg-background-tertiary px-2 py-0.5 border border-border-gold/20 text-text-secondary">
                                Media {job.mediaStatus}
                              </span>
                            )}
                          </div>

                          {(job.mediaMessage || job.mediaStatus) && (
                            <div className="mt-2 text-xs text-text-secondary">
                              {job.mediaMessage || job.mediaStatus}
                            </div>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 px-3 border-green-500 text-green-700 hover:bg-green-50"
                              disabled={moderationActionId === job.id}
                              onClick={() => handleModerationAction(job.id, 'approve')}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 px-3 border-red-500 text-red-700 hover:bg-red-50"
                              disabled={moderationActionId === job.id}
                              onClick={() => handleModerationAction(job.id, 'reject')}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-8 px-3 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                              disabled={moderationActionId === job.id}
                              onClick={() => handleModerationAction(job.id, 'request_reshoot')}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Request reshoot
                            </Button>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeTab === 'analytics' && (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Insights & KPIs</h1>
                <p className="text-text-secondary mt-1">Live snapshots from the trust & monetization pipeline.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => router.push('/admin/analytics')}>
                  Open Real-Time Analytics
                </Button>
                <select
                  value={snapshotType}
                  onChange={(e) => setSnapshotType(e.target.value as SnapshotType)}
                  className="px-4 py-2 border border-border-gold/20 rounded-lg bg-background-secondary text-sm font-medium capitalize"
                >
                  {[
                    { value: 'activation', label: 'Activation' },
                    { value: 'retention', label: 'Retention' },
                    { value: 'revenue', label: 'Revenue' },
                    { value: 'trust', label: 'Trust' }
                  ].map((option) => (
                    <option key={option.value} value={option.value} className="capitalize">
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={snapshotRange}
                  onChange={(e) => setSnapshotRange(e.target.value as SnapshotRange)}
                  className="px-4 py-2 border border-border-gold/20 rounded-lg bg-background-secondary text-sm font-medium capitalize"
                >
                  {[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ].map((option) => (
                    <option key={option.value} value={option.value} className="capitalize">
                      {option.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => fetchAnalyticsSnapshots({ refresh: true })}
                  disabled={snapshotLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${snapshotLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>

            {snapshotError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {snapshotError}
              </div>
            )}

            {snapshotLoading && analyticsSnapshots.length === 0 && (
              <div className="mb-6 bg-background-secondary border border-border-gold/20 rounded-xl p-6 flex items-center gap-3 text-text-secondary">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                Fetching analytics snapshots…
              </div>
            )}

            {!snapshotLoading && analyticsSnapshots.length === 0 && !snapshotError && (
              <div className="bg-background-secondary border border-dashed border-border-gold/30 rounded-xl p-10 text-center text-text-secondary">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-semibold text-gray-900 mb-2">No snapshots yet</p>
                <p className="text-sm mb-4">Kick off a snapshot to populate this dashboard.</p>
                <Button onClick={() => fetchAnalyticsSnapshots({ refresh: true })}>
                  Generate Snapshot
                </Button>
              </div>
            )}

            {analyticsSnapshots.length > 0 && latestSnapshot && (
              <>
                <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-text-tertiary">Snapshot window</p>
                      <h3 className="text-2xl font-bold text-gray-900">{formatSnapshotWindow(latestSnapshot)}</h3>
                      <p className="text-xs text-text-tertiary mt-1">Generated {formatSnapshotTimestamp(latestSnapshot.generatedAt)}</p>
                      {latestSnapshot.notes && (
                        <p className="text-xs text-purple-600 mt-2">{latestSnapshot.notes}</p>
                      )}
                    </div>
                    <div className="text-sm text-right text-text-secondary">
                      <p className="font-semibold text-gray-900">{latestSnapshot.type.charAt(0).toUpperCase() + latestSnapshot.type.slice(1)} · {latestSnapshot.range}</p>
                      <p className="text-xs text-text-tertiary">Source: {latestSnapshot.source}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {latestSnapshotMetrics.map(([key, value]) => (
                      <div key={key} className="border border-border-gold/10 rounded-lg p-4 bg-background-tertiary">
                        <p className="text-xs uppercase tracking-wide text-text-tertiary">{formatMetricLabel(key)}</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-1">{formatMetricValue(key, value)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Recent windows</h3>
                      <p className="text-xs text-text-tertiary">Comparing up to the last six snapshots.</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="text-text-tertiary text-xs uppercase tracking-wide">
                          <th className="py-2 pr-4">Window</th>
                          {snapshotColumns.map((column) => (
                            <th key={column} className="py-2 pr-4">
                              {formatMetricLabel(column)}
                            </th>
                          ))}
                          <th className="py-2 pr-4">Generated</th>
                        </tr>

                      </thead>
                      <tbody>
                        {analyticsSnapshots.map((snapshot) => (
                          <tr key={snapshot.id ?? snapshot.windowStart} className="border-t border-border-gold/10">
                            <td className="py-2 pr-4 font-medium text-gray-900">{formatSnapshotWindow(snapshot)}</td>
                            {snapshotColumns.map((column) => (
                              <td key={`${snapshot.windowStart}-${column}`} className="py-2 pr-4 text-text-secondary">
                                {snapshot.metrics[column] !== undefined ? formatMetricValue(column, snapshot.metrics[column]) : '—'}
                              </td>
                            ))}
                            <td className="py-2 pr-4 text-text-tertiary">{formatSnapshotTimestamp(snapshot.generatedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <div className="mt-10 bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Cohort explorer</h2>
                  <p className="text-sm text-text-secondary">Follow week-over-week retention and monetization performance by cohort.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={cohortDimension}
                    onChange={(event) => setCohortDimension(event.target.value)}
                    className="px-4 py-2 border border-border-gold/20 rounded-lg bg-background-secondary text-sm font-medium capitalize"
                  >
                    {COHORT_DIMENSION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="capitalize">
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={cohortLimit}
                    onChange={(event) => setCohortLimit(Number(event.target.value))}
                    className="px-4 py-2 border border-border-gold/20 rounded-lg bg-background-secondary text-sm font-medium"
                  >
                    {COHORT_LIMIT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option} cohorts
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => fetchCohortExplorer()}
                    disabled={cohortLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${cohortLoading ? 'animate-spin' : ''}`} />
                    Refresh cohorts
                  </Button>
                </div>
              </div>

              {cohortError && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {cohortError}
                </div>
              )}

              {cohortLoading && (!cohortData || cohortData.rows.length === 0) && (
                <div className="mt-6 flex items-center gap-3 text-text-secondary">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  Fetching cohort metrics…
                </div>
              )}

              {cohortData && cohortData.rows.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="border border-border-gold/10 rounded-lg p-4 bg-background-tertiary">
                      <p className="text-xs uppercase tracking-wide text-text-tertiary">Tracked cohorts</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{cohortData.summary.cohortCount}</p>
                      <p className="text-xs text-text-tertiary mt-1">Dimension: {cohortData.summary.dimension ?? 'all'}</p>
                    </div>
                    <div className="border border-border-gold/10 rounded-lg p-4 bg-background-tertiary">
                      <p className="text-xs uppercase tracking-wide text-text-tertiary">Avg retention</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{formatRetentionRate(cohortData.summary.averageRetentionRate)}</p>
                      <p className="text-xs text-text-tertiary mt-1">Across {cohortWeekNumbers.length} recorded weeks</p>
                    </div>
                    <div className="border border-border-gold/10 rounded-lg p-4 bg-background-tertiary">
                      <p className="text-xs uppercase tracking-wide text-text-tertiary">Avg revenue / user</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrencyCompact(cohortData.summary.averageRevenuePerUser)}</p>
                      <p className="text-xs text-text-tertiary mt-1">Rolling weekly ARPU</p>
                    </div>
                  </div>

                  {cohortWeekNumbers.length > 0 ? (
                    <div className="overflow-x-auto mt-6">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                          <tr className="text-text-tertiary text-xs uppercase tracking-wide">
                            <th className="py-2 pr-4">Cohort</th>
                            {cohortWeekNumbers.map((week) => (
                              <th key={week} className="py-2 pr-4">Week {week}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cohortData.rows.map((row) => (
                            <tr key={row.cohortKey} className="border-t border-border-gold/10">
                              <td className="py-3 pr-4 align-top">
                                <p className="font-semibold text-gray-900 text-sm">{row.cohortKey}</p>
                                <p className="text-xs text-text-tertiary">{formatCohortDate(row.cohortDate)}</p>
                                <p className="text-xs text-text-tertiary">Dimension: {row.dimension}</p>
                              </td>
                              {cohortWeekNumbers.map((week) => {
                                const metric = row.metrics.find((item) => item.weekNumber === week)
                                if (!metric) {
                                  return (
                                    <td key={`${row.cohortKey}-w${week}`} className="py-3 pr-4 text-center text-gray-400">
                                      —
                                    </td>
                                  )
                                }

                                return (
                                  <td key={`${row.cohortKey}-w${week}`} className="py-3 pr-4">
                                    <p className="text-sm font-semibold text-gray-900">{formatRetentionRate(metric.retentionRate)}</p>
                                    <p className="text-xs text-text-tertiary">{formatCurrencyCompact(metric.revenuePerUser)} ARPU</p>
                                    {metric.notes && (
                                      <p className="text-[11px] text-gray-400 mt-1">{metric.notes}</p>
                                    )}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-6 text-sm text-text-secondary">No weekly metrics recorded yet for this dimension.</p>
                  )}
                </>
              )}

              {!cohortLoading && !cohortError && (!cohortData || cohortData.rows.length === 0) && (
                <div className="mt-6 border border-dashed border-gray-300 rounded-lg p-6 text-center text-text-secondary">
                  <p className="text-sm font-semibold text-gray-900 mb-1">No cohort metrics yet</p>
                  <p className="text-xs text-text-tertiary">Switch dimensions or lower the limit to backfill data as metrics are generated.</p>
                </div>
              )}
            </div>

            <div className="mt-10 bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Retention experiment suite</h2>
                  <p className="text-sm text-text-secondary">AI nudges, guardian loops, and reactivation drips currently staged.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => router.push('/admin/experiments')}>
                  Manage experiments
                </Button>
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {retentionExperimentCatalog.map((experiment) => (
                  <div key={experiment.id} className="border border-border-gold/10 rounded-lg p-4 bg-background-tertiary">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">{experiment.type.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-lg font-semibold text-gray-900">{experiment.name}</p>
                    <p className="text-xs text-text-tertiary">{experiment.hypothesis}</p>
                    <div className="mt-3 text-xs text-text-tertiary">
                      <p className="font-semibold text-text-secondary">Targeting</p>
                      <p>{experiment.targeting}</p>
                    </div>
                    <div className="mt-3 text-xs text-text-tertiary">
                      <p className="font-semibold text-text-secondary">Metrics</p>
                      <p>{experiment.metrics.join(', ')}</p>
                    </div>
                    <span className="mt-3 inline-flex rounded-full bg-purple-50 px-3 py-1 text-[11px] font-semibold text-purple-700">
                      {experiment.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'realtime' && (
          <div className="space-y-6">
            <RealtimeAnalyticsPanel />
          </div>
        )}

        {/* BOOST AUCTIONS VIEW */}
        {activeTab === 'boosts' && (
          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Boost Auction Control</h1>
                <p className="text-text-secondary mt-1">Monitor auction queues, inspect bids, and force clear windows when needed.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={boostLocale}
                  onChange={(event) => setBoostLocale(event.target.value as AuctionLocale)}
                  className="px-4 py-2 border border-border-gold/20 rounded-lg bg-background-secondary text-sm font-medium"
                >
                  {BOOST_AUCTION_LOCALES.map((locale) => (
                    <option key={locale} value={locale}>
                      {formatAuctionLocaleLabel(locale)}
                    </option>
                  ))}
                </select>
                <select
                  value={boostPlacement}
                  onChange={(event) => setBoostPlacement(event.target.value as AuctionPlacement)}
                  className="px-4 py-2 border border-border-gold/20 rounded-lg bg-background-secondary text-sm font-medium"
                >
                  {BOOST_AUCTION_PLACEMENTS.map((placement) => (
                    <option key={placement} value={placement}>
                      {formatAuctionPlacementLabel(placement)}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => fetchBoostAdminWindow()}
                  disabled={boostLoading}
                >
                  <RefreshCw className={`w-4 h-4 ${boostLoading ? 'animate-spin' : ''}`} />
                  Refresh window
                </Button>
              </div>
            </div>

            {boostError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {boostError}
              </div>
            )}

            {boostActionMessage && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {boostActionMessage}
              </div>
            )}

            {boostLoading && !boostWindow && (
              <div className="mb-6 bg-background-secondary border border-border-gold/20 rounded-xl p-6 flex items-center gap-3 text-text-secondary">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                Fetching boost auction data…
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Current window</h3>
                {boostWindow ? (
                  <div className="text-sm text-text-secondary space-y-2">
                    <p>
                      <span className="text-text-tertiary">Window start:</span> {formatDateTime(boostWindow.windowStart)}
                    </p>
                    <p>
                      <span className="text-text-tertiary">Boost run:</span> {formatDateTime(boostWindow.boostStartsAt)} → {formatDateTime(boostWindow.boostEndsAt)}
                    </p>
                    <p>
                      <span className="text-text-tertiary">Min bid:</span> {formatCredits(boostWindow.minBidCredits)}
                    </p>
                    <p>
                      <span className="text-text-tertiary">Max winners:</span> {boostWindow.maxWinners}
                    </p>
                    <p>
                      <span className="text-text-tertiary">Pending bids:</span> {boostPendingBids.length}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary">No active window details available.</p>
                )}
              </div>

              <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Next window</h3>
                {boostNextWindow ? (
                  <div className="text-sm text-text-secondary space-y-2">
                    <p>
                      <span className="text-text-tertiary">Window start:</span> {formatDateTime(boostNextWindow.windowStart)}
                    </p>
                    <p>
                      <span className="text-text-tertiary">Boost run:</span> {formatDateTime(boostNextWindow.boostStartsAt)} → {formatDateTime(boostNextWindow.boostEndsAt)}
                    </p>
                    <p>
                      <span className="text-text-tertiary">Queued bids:</span> {boostNextWindow.pendingCount ?? boostNextWindowBids.length}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-text-tertiary">Awaiting next window calculation.</p>
                )}
              </div>

              <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Manual controls</h3>
                    <p className="text-xs text-text-tertiary">Use sparingly; impacts live members.</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-text-secondary">
                  <p>
                    <span className="text-text-tertiary">Active sessions:</span> {boostActiveSessions.length}
                  </p>
                  <Button
                    variant="destructive"
                    className="w-full justify-center"
                    onClick={handleForceClearAuctionWindow}
                    disabled={boostActionLoading || !boostWindow}
                  >
                    {boostActionLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Clearing window…
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Force clear & activate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
              <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Pending bids</h3>
                    <p className="text-xs text-text-tertiary">Aligned to the current window.</p>
                  </div>
                  <span className="text-xs font-semibold text-text-tertiary">{boostPendingBids.length} queued</span>
                </div>
                {boostPendingBids.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No bids waiting for this window.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="text-text-tertiary text-xs uppercase tracking-wide">
                          <th className="py-2 pr-4">Bidder</th>
                          <th className="py-2 pr-4">Bid</th>
                          <th className="py-2 pr-4">Window</th>
                          <th className="py-2 pr-4">Auto-rollover</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boostPendingBids.map((bid) => (
                          <tr key={bid.sessionId} className="border-t border-border-gold/10">
                            <td className="py-2 pr-4">
                              <p className="font-mono text-xs text-gray-900">{bid.userId}</p>
                              <p className="text-xs text-text-tertiary">Session {bid.sessionId}</p>
                            </td>
                            <td className="py-2 pr-4 font-semibold text-gray-900">{formatCredits(bid.bidAmountCredits)}</td>
                            <td className="py-2 pr-4 text-xs text-text-tertiary">{formatRelativeTimeSafe(bid.auctionWindowStart)}</td>
                            <td className="py-2 pr-4 text-xs text-text-tertiary">
                              {bid.autoRollover ? `Enabled (${bid.rolloverCount})` : 'Disabled'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Next window queue</h3>
                    <p className="text-xs text-text-tertiary">Bids already staged for the next run.</p>
                  </div>
                  <span className="text-xs font-semibold text-text-tertiary">{boostNextWindowBids.length} queued</span>
                </div>
                {boostNextWindowBids.length === 0 ? (
                  <p className="text-sm text-text-tertiary">No bids queued yet for the next window.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="text-text-tertiary text-xs uppercase tracking-wide">
                          <th className="py-2 pr-4">Bidder</th>
                          <th className="py-2 pr-4">Bid</th>
                          <th className="py-2 pr-4">Window</th>
                          <th className="py-2 pr-4">Auto-rollover</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boostNextWindowBids.map((bid) => (
                          <tr key={bid.sessionId} className="border-t border-border-gold/10">
                            <td className="py-2 pr-4">
                              <p className="font-mono text-xs text-gray-900">{bid.userId}</p>
                              <p className="text-xs text-text-tertiary">Session {bid.sessionId}</p>
                            </td>
                            <td className="py-2 pr-4 font-semibold text-gray-900">{formatCredits(bid.bidAmountCredits)}</td>
                            <td className="py-2 pr-4 text-xs text-text-tertiary">{formatRelativeTimeSafe(bid.auctionWindowStart)}</td>
                            <td className="py-2 pr-4 text-xs text-text-tertiary">
                              {bid.autoRollover ? `Enabled (${bid.rolloverCount})` : 'Disabled'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Live boost sessions</h3>
                  <p className="text-xs text-text-tertiary">Currently running placements for this locale.</p>
                </div>
                <span className="text-xs font-semibold text-text-tertiary">{boostActiveSessions.length} active</span>
              </div>
              {boostActiveSessions.length === 0 ? (
                <p className="text-sm text-text-tertiary">No active boosts are running for this selection.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-text-tertiary text-xs uppercase tracking-wide">
                        <th className="py-2 pr-4">Bidder</th>
                        <th className="py-2 pr-4">Bid</th>
                        <th className="py-2 pr-4">Boost window</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boostActiveSessions.map((session) => (
                        <tr key={session.sessionId} className="border-t border-border-gold/10">
                          <td className="py-2 pr-4">
                            <p className="font-mono text-xs text-gray-900">{session.userId}</p>
                            <p className="text-xs text-text-tertiary">Session {session.sessionId}</p>
                          </td>
                          <td className="py-2 pr-4 font-semibold text-gray-900">{formatCredits(session.bidAmountCredits)}</td>
                          <td className="py-2 pr-4 text-xs text-text-tertiary">
                            {formatDateTime(session.startedAt)} → {formatDateTime(session.endsAt)}
                          </td>
                          <td className="py-2 pr-4">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                              {session.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MARKETING VIEW */}
        {activeTab === 'marketing' && (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Marketing & Growth</h1>
                <p className="text-text-secondary mt-1">Early UI for future campaigns and promotions (not yet live).</p>
              </div>
              <Button disabled className="cursor-not-allowed opacity-60">
                <Zap className="w-4 h-4 mr-2" />
                New Campaign (coming soon)
              </Button>
            </div>

            {/* Marketing Tools - currently illustrative only */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[
                { title: 'Email Campaigns', icon: Mail, color: 'bg-blue-500', count: '3 active' },
                { title: 'Push Notifications', icon: Bell, color: 'bg-purple-500', count: '12 sent today' },
                { title: 'Promotions', icon: Gift, color: 'bg-orange-500', count: '2 running' },
                { title: 'Referral Program', icon: Users, color: 'bg-green-500', count: '145 referrals' },
                { title: 'Social Media', icon: Globe, color: 'bg-pink-500', count: '5k followers' },
                { title: 'Analytics Reports', icon: FileText, color: 'bg-indigo-500', count: 'Weekly' }
              ].map((tool, index) => {
                const Icon = tool.icon
                return (
                  <div key={index} className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6 opacity-80">
                    <div className={`${tool.color} p-3 rounded-lg w-fit mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.title}</h3>
                    <p className="text-sm text-text-secondary">{tool.count}</p>
                  </div>
                )
              })}
            </div>

            {/* Conversion Funnel - demo numbers only until analytics is wired */}
            <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Conversion Funnel</h3>
              <p className="text-xs text-text-tertiary mb-6">These funnel stages and counts are placeholders to help design decisions; they are not live traffic data yet.</p>
              <div className="space-y-4">
                {[
                  { stage: 'Visitors', count: 10000, percentage: 100 },
                  { stage: 'Sign Ups', count: 2500, percentage: 25 },
                  { stage: 'Profile Complete', count: 1800, percentage: 18 },
                  { stage: 'First Match', count: 1200, percentage: 12 },
                  { stage: 'Premium Upgrade', count: 300, percentage: 3 }
                ].map((stage, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-text-secondary font-medium">{stage.stage}</span>
                      <span className="text-gray-900 font-semibold">{stage.count.toLocaleString()} ({stage.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-linear-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500" style={{ width: `${stage.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
        {/* EMAIL USERS VIEW */}
        {activeTab === 'email' && (
          <EmailUsersSection users={users} />
        )}

        {activeTab === 'settings' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Platform Settings</h1>

            <div className="space-y-6">
              <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Platform Name</label>
                    <Input defaultValue="Tribal Mingle" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Contact Email</label>
                    <Input type="email" defaultValue="admin@tribalmingle.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">Support Phone</label>
                    <Input type="tel" defaultValue="+44 20 1234 5678" />
                  </div>
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Feature Toggles</h3>
                <p className="text-xs text-text-tertiary mb-4">
                  These switches are UI-only for now and should mirror real configuration in your backend / infrastructure.
                </p>
                <div className="space-y-3">
                  {[{
                    label: 'User Registrations',
                    enabled: true,
                    description: 'Allow new members to sign up for Tribal Mingle.'
                  }, {
                    label: 'Email Verifications',
                    enabled: true,
                    description: 'Require users to verify their email before full access.'
                  }, {
                    label: 'Profile Matching',
                    enabled: true,
                    description: 'Enable match suggestions based on tribe, location, and preferences.'
                  }, {
                    label: 'In-App Messaging',
                    enabled: true,
                    description: 'Allow members to send messages inside Tribal Mingle.'
                  }, {
                    label: 'Video Calls (coming soon)',
                    enabled: false,
                    description: 'Planned feature for premium members – not yet available.',
                    isPlaceholder: true
                  }, {
                    label: 'Maintenance Mode (manual only)',
                    enabled: false,
                    description: 'Conceptual toggle – actual maintenance windows should be configured server-side.',
                    isPlaceholder: true
                  }].map((feature, index) => (
                    <label
                      key={index}
                      className={`flex items-start justify-between p-3 rounded-lg cursor-pointer transition ${
                        feature.isPlaceholder ? 'bg-background-tertiary opacity-80' : 'hover:bg-background-tertiary'
                      }`}
                    >
                      <div className="mr-3">
                        <div className="text-gray-800 font-medium text-sm flex items-center gap-2">
                          {feature.label}
                          {feature.isPlaceholder && (
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-gray-200 text-text-secondary">
                              UI only
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-text-tertiary mt-0.5 leading-snug">
                          {feature.description}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={feature.enabled}
                        disabled={!!feature.isPlaceholder}
                        className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">Security & Audit</h3>
                <p className="text-xs text-text-tertiary mb-4">
                  These controls are placeholders for future security tooling. Actual enforcement should live in your auth provider / backend.
                </p>
                <div className="space-y-3">
                  <Button variant="outline" className="w-full justify-start opacity-80 cursor-not-allowed" disabled>
                    <Shield className="w-4 h-4 mr-2" />
                    Configure 2FA
                    <span className="ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-background-tertiary text-text-secondary">
                      Coming soon
                    </span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start opacity-80 cursor-not-allowed" disabled>
                    <Lock className="w-4 h-4 mr-2" />
                    Password Policy
                    <span className="ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-background-tertiary text-text-secondary">
                      Configure in auth provider
                    </span>
                  </Button>
                  <Button variant="outline" className="w-full justify-start opacity-80 cursor-not-allowed" disabled>
                    <FileText className="w-4 h-4 mr-2" />
                    View Audit Logs
                    <span className="ml-2 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-background-tertiary text-text-secondary">
                      Integrate with logging stack
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedLivenessItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
          <div className="relative w-full max-w-3xl rounded-2xl bg-background-secondary p-6 shadow-2xl">
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full border border-gray-200 p-2 text-text-tertiary hover:text-gray-800"
              onClick={closeLivenessReviewModal}
              aria-label="Close manual review modal"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="pr-10">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-600">Manual review</p>
              <h2 className="text-2xl font-semibold text-gray-900">Resolve liveness session</h2>
              <p className="text-sm text-text-secondary">
                Session {selectedLivenessItem.sessionToken ?? '—'} · {formatRelativeTime(selectedLivenessItem.createdAt)} · Intent{' '}
                {(selectedLivenessItem.intent ?? 'manual_review').replace(/_/g, ' ')}
              </p>
            </div>

            {livenessReviewError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {livenessReviewError}
              </div>
            )}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-text-tertiary">Member</p>
                <p className="text-base font-semibold text-gray-900">{selectedLivenessItem.userId}</p>
                <p className="text-xs text-text-tertiary mt-1">Locale {formatLocaleTag(selectedLivenessItem.locale)}</p>
                <p className="text-xs text-text-tertiary">Status {(selectedLivenessItem.status ?? 'manual_review').replace(/_/g, ' ')}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <p className="text-xs uppercase tracking-wide text-text-tertiary">Provider signal</p>
                <p className="text-base font-semibold text-gray-900">
                  {(selectedLivenessItem.providerDecision ?? 'pending').replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  Confidence {selectedLivenessItem.providerConfidence != null ? `${Math.round(selectedLivenessItem.providerConfidence * 100)}%` : '—'}
                </p>
                <p className="text-xs text-text-tertiary">
                  Score delta {formatTrustScoreDelta(selectedLivenessItem.scoreDelta)} · Aggregate {formatAggregateScore(selectedLivenessItem.aggregateScore)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-border-gold/10 bg-background-tertiary p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">Flagged reasons</p>
              {selectedLivenessItem.reasons?.length ? (
                <div className="flex flex-wrap gap-2">
                  {selectedLivenessItem.reasons.map((reason) => (
                    <span key={`${selectedLivenessItem.id}-${reason}`} className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
                      {reason.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-tertiary">Provider did not send concrete reasons. Use your judgement.</p>
              )}
            </div>

            <form onSubmit={handleSubmitLivenessReview} className="mt-6 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">Resolution</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {LIVENESS_RESOLUTION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setLivenessResolution(option.value)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition focus:outline-none ${
                        livenessResolution === option.value
                          ? 'border-purple-600 bg-purple-50 text-purple-900'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-xs text-text-secondary">{option.helper}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary" htmlFor="liveness-review-note">Reviewer note (optional)</label>
                <textarea
                  id="liveness-review-note"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                  rows={4}
                  value={livenessReviewNote}
                  onChange={(event) => setLivenessReviewNote(event.target.value)}
                  placeholder="Summarize why you approved, rejected, or need a reshoot."
                />
                <p className="mt-1 text-xs text-text-tertiary">Notes help future reviewers understand the decision trail.</p>
              </div>

              {!selectedLivenessItem.sessionToken && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                  Missing session token – refresh the queue or ask engineering for support.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={closeLivenessReviewModal}>
                  Cancel
                </Button>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-text-tertiary">Decision notifies trust signals automatically.</p>
                  <Button type="submit" disabled={livenessReviewLoading || !selectedLivenessItem.sessionToken}>
                    {livenessReviewLoading ? 'Saving…' : 'Record decision'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Email Users Section Component
function EmailUsersSection({ users }: { users: User[] }) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [emailType, setEmailType] = useState<'individual' | 'bulk'>('individual')
  const [segment, setSegment] = useState<'all' | 'free' | 'premium' | 'inactive'>('all')
  const [template, setTemplate] = useState<'custom' | 'welcome' | 'winback' | 'upgrade'>('custom')

  // Apply segment filter on top of search
  const segmentedUsers = users.filter(user => {
    if (segment === 'all') return true
    if (segment === 'free') return user.subscriptionPlan === 'free'
    if (segment === 'premium') return user.subscriptionPlan !== 'free'
    if (segment === 'inactive') {
      const lastActive = user.lastActive ? new Date(user.lastActive) : null
      if (!lastActive) return true
      const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceActive >= 30
    }
    return true
  })

  const filteredUsers = segmentedUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(u => u._id))
    }
  }

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setEmailStatus({ type: 'error', message: 'Please fill in both subject and message' })
      return
    }

    if (selectedUsers.length === 0) {
      setEmailStatus({ type: 'error', message: 'Please select at least one user' })
      return
    }

    setSendingEmail(true)
    setEmailStatus(null)

    try {
      const response = await fetch('/api/admin/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          subject: emailSubject,
          message: emailMessage,
          segment,
          template
        })
      })

      const data = await response.json()

      if (data.success) {
        setEmailStatus({ 
          type: 'success', 
          message: `Email sent successfully to ${data.sentCount} user(s)!` 
        })
        setEmailSubject('')
        setEmailMessage('')
        setSelectedUsers([])
      } else {
        setEmailStatus({ type: 'error', message: data.message || 'Failed to send email' })
      }
    } catch (error) {
      setEmailStatus({ type: 'error', message: 'An error occurred while sending email' })
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Users</h1>
          <p className="text-text-secondary mt-1">Send targeted, on-brand emails to your members</p>
        </div>
        <Button onClick={handleSendEmail} disabled={sendingEmail || selectedUsers.length === 0} className="bg-purple-600 hover:bg-purple-700">
          <Mail className="w-4 h-4 mr-2" />
          {sendingEmail ? 'Sending...' : `Send to ${selectedUsers.length} User(s)`}
        </Button>
      </div>

      {emailStatus && (
        <div className={`mb-6 p-4 rounded-lg ${
          emailStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {emailStatus.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="font-medium">{emailStatus.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Compose Email */}
        <div className="space-y-6">
          <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Compose Email</h3>
                <p className="text-sm text-text-secondary">Create your message</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Template Presets */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Template</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTemplate('custom')
                    }}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                      template === 'custom'
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-gray-200 hover:bg-background-tertiary'
                    }`}
                  >
                    <span className="block font-semibold">Custom</span>
                    <span className="block text-xs text-text-secondary">Write any message</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplate('welcome')
                      if (!emailSubject) {
                        setEmailSubject('Welcome to Tribal Mingle 495')
                      }
                      if (!emailMessage) {
                        setEmailMessage('Hi there,\n\nWelcome to Tribal Mingle! Start by completing your profile and exploring matches from your tribe and beyond.\n\nWith love,\nThe Tribal Mingle team')
                      }
                    }}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                      template === 'welcome'
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-gray-200 hover:bg-background-tertiary'
                    }`}
                  >
                    <span className="block font-semibold">Welcome new members</span>
                    <span className="block text-xs text-text-secondary">Gently nudge profile completion</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplate('winback')
                      if (!emailSubject) {
                        setEmailSubject("We've missed you on Tribal Mingle")
                      }
                      if (!emailMessage) {
                        setEmailMessage('Hi there,\n\nWe noticed you haven\'t visited Tribal Mingle in a while. New members from your tribe have joined why not take another look today?\n\nWarm wishes,\nThe Tribal Mingle team')
                      }
                    }}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                      template === 'winback'
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-gray-200 hover:bg-background-tertiary'
                    }`}
                  >
                    <span className="block font-semibold">Win back inactive users</span>
                    <span className="block text-xs text-text-secondary">Encourage another visit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTemplate('upgrade')
                      if (!emailSubject) {
                        setEmailSubject('Unlock more matches with Premium')
                      }
                      if (!emailMessage) {
                        setEmailMessage('Hi there,\n\nYou\'re getting interest on Tribal Mingle 680. Upgrade to Premium to see everyone who likes you and message freely.\n\nTap upgrade inside the app to see plans for your tribe community.\n\nThanks,\nThe Tribal Mingle team')
                      }
                    }}
                    className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                      template === 'upgrade'
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-gray-200 hover:bg-background-tertiary'
                    }`}
                  >
                    <span className="block font-semibold">Promote Premium</span>
                    <span className="block text-xs text-text-secondary">Upsell to paid plans</span>
                  </button>
                </div>
                <p className="text-xs text-text-tertiary mt-1">
                  Selecting a template can prefill subject and copy if those fields are empty. You can always edit the text below.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Email Subject *</label>
                <Input
                  placeholder="Enter email subject..."
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Email Message *</label>
                <textarea
                  placeholder="Write your message here... This will be beautifully formatted in the email template."
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
                <p className="text-xs text-text-tertiary mt-2">
                  Your message will be wrapped in a professional email template with Tribal Mingle branding
                </p>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div className="bg-linear-to-br from-purple-50 to-orange-50 rounded-xl p-6 border border-purple-200">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              Email Preview
            </h4>
            <div className="bg-background-secondary rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                <img src="/triballogo.png" alt="Logo" className="w-8 h-8" />
                <span className="font-bold text-purple-900">Tribal Mingle</span>
              </div>
              <h3 className="font-bold text-lg mb-2">{emailSubject || 'Your Subject Here'}</h3>
              <div className="text-text-secondary whitespace-pre-wrap text-sm">
                {emailMessage || 'Your message will appear here...'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Select Recipients */}
        <div className="space-y-6">
          <div className="bg-background-secondary rounded-xl shadow-sm border border-border-gold/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Select Recipients</h3>
                <p className="text-sm text-text-secondary">{selectedUsers.length} selected</p>
              </div>
              <Button variant="outline" onClick={handleSelectAll} size="sm">
                {selectedUsers.length === filteredUsers.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Segments */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-2">Audience segment</label>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSegment('all')}
                  className={`px-3 py-1 rounded-full border transition ${
                    segment === 'all'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:bg-background-tertiary'
                  }`}
                >
                  All users
                </button>
                <button
                  type="button"
                  onClick={() => setSegment('free')}
                  className={`px-3 py-1 rounded-full border transition ${
                    segment === 'free'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:bg-background-tertiary'
                  }`}
                >
                  Free only
                </button>
                <button
                  type="button"
                  onClick={() => setSegment('premium')}
                  className={`px-3 py-1 rounded-full border transition ${
                    segment === 'premium'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:bg-background-tertiary'
                  }`}
                >
                  Paying members
                </button>
                <button
                  type="button"
                  onClick={() => setSegment('inactive')}
                  className={`px-3 py-1 rounded-full border transition ${
                    segment === 'inactive'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:bg-background-tertiary'
                  }`}
                >
                  Inactive (30+ days)
                </button>
              </div>
              <p className="text-xs text-text-tertiary mt-1">
                Segments help you narrow the list before manually picking recipients.
              </p>
            </div>

            {/* Search Users */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-text-tertiary">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No users found</p>
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <label
                    key={user._id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                      selectedUsers.includes(user._id)
                        ? 'bg-purple-50 border-2 border-purple-300'
                        : 'bg-background-tertiary border-2 border-transparent hover:bg-background-tertiary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user._id)}
                      onChange={() => handleSelectUser(user._id)}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 to-orange-500 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
                      <div className="text-xs text-text-secondary">{user.email}</div>
                    </div>
                    {user.subscriptionPlan === 'premium' && (
                      <Crown className="w-4 h-4 text-orange-500" />
                    )}
                    {user.verified && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
})

const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const relativeTimeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
})

function formatRetentionRate(value: number) {
  if (!Number.isFinite(value)) {
    return '0%'
  }
  if (value <= 1) {
    return `${(value * 100).toFixed(1)}%`
  }
  return `${value.toFixed(1)}%`
}

function formatCurrencyCompact(value: number) {
  if (!Number.isFinite(value)) {
    return '$0.00'
  }

  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`
  }

  return `$${value.toFixed(2)}`
}

function formatCohortDate(value: string) {
  const parsed = safeDate(value)
  if (!parsed) {
    return value
  }
  return dateFormatter.format(parsed)
}

function formatAuctionLocaleLabel(locale: string) {
  if ((BOOST_LOCALE_LABELS as Record<string, string>)[locale]) {
    return (BOOST_LOCALE_LABELS as Record<string, string>)[locale]
  }
  return locale.replace(/_/g, ' ')
}

function formatAuctionPlacementLabel(placement: string) {
  if ((BOOST_PLACEMENT_LABELS as Record<string, string>)[placement]) {
    return (BOOST_PLACEMENT_LABELS as Record<string, string>)[placement]
  }
  return placement.replace(/_/g, ' ')
}

function formatCredits(value: number) {
  if (!Number.isFinite(value)) {
    return '0 credits'
  }
  return `${value.toLocaleString()} credits`
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '—'
  }
  const parsed = safeDate(value)
  if (!parsed) {
    return value
  }
  return dateTimeFormatter.format(parsed)
}

function formatRelativeTimeSafe(value?: string | null) {
  if (!value) {
    return '—'
  }
  return formatRelativeTime(value)
}

function formatMetricLabel(key: string) {
  return key
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function formatMetricValue(key: string, value: number) {
  if (!Number.isFinite(value)) {
    return '0'
  }

  if (key.endsWith('_cents')) {
    return currencyFormatter.format(value / 100)
  }

  if (key.includes('rate') || key.includes('percentage')) {
    return `${(value * 100).toFixed(1)}%`
  }

  if (Math.abs(value) >= 1000) {
    return compactNumberFormatter.format(value)
  }

  return value.toLocaleString()
}

function formatSnapshotWindow(snapshot: AnalyticsSnapshot) {
  const start = safeDate(snapshot.windowStart)
  const end = safeDate(snapshot.windowEnd)
  if (!start || !end) {
    return `${snapshot.windowStart} – ${snapshot.windowEnd}`
  }
  return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`
}

function formatSnapshotTimestamp(value: string) {
  const date = safeDate(value)
  if (!date) {
    return value
  }
  return dateTimeFormatter.format(date)
}

function formatRelativeTime(value: string) {
  const date = safeDate(value)
  if (!date) {
    return value
  }

  let delta = Math.round((date.getTime() - Date.now()) / 1000)
  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: 'second' },
    { amount: 60, unit: 'minute' },
    { amount: 24, unit: 'hour' },
    { amount: 7, unit: 'day' },
  ]

  for (const division of divisions) {
    if (Math.abs(delta) < division.amount) {
      return relativeTimeFormatter.format(delta, division.unit)
    }
    delta = Math.round(delta / division.amount)
  }

  return dateFormatter.format(date)
}

function formatMediaTypeLabel(type: 'id' | 'selfie' | 'voice' | 'video') {
  switch (type) {
    case 'id':
      return 'Government ID'
    case 'selfie':
      return 'Selfie'
    case 'voice':
      return 'Voice introduction'
    case 'video':
      return 'Video greeting'
    default:
      return type
  }
}

function formatAiScoreLabel(score?: number | null) {
  if (typeof score !== 'number' || Number.isNaN(score)) {
    return null
  }

  const normalized = Math.min(1, Math.max(0, score))
  return `${Math.round(normalized * 100)}% AI confidence`
}

function formatLocaleTag(locale?: string) {
  if (!locale) {
    return '—'
  }
  return locale.toUpperCase()
}

function formatTrustScoreDelta(value: number) {
  if (!Number.isFinite(value)) {
    return '0 pts'
  }
  const percent = Math.round(value * 100)
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${percent} pts`
}

function formatAggregateScore(value: number) {
  if (!Number.isFinite(value)) {
    return '—'
  }
  return `${Math.round(value * 100)}%`
}

function getStatusBadgeClass(status?: string) {
  switch (status) {
    case 'manual_review':
      return 'bg-yellow-100 text-yellow-800'
    case 'awaiting_provider':
      return 'bg-blue-100 text-blue-800'
    case 'awaiting_upload':
    case 'created':
      return 'bg-background-tertiary text-text-primary'
    case 'passed':
      return 'bg-green-100 text-green-800'
    case 'failed':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-background-tertiary text-text-primary'
  }
}

function safeDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}



