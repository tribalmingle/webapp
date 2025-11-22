import { z } from 'zod'

import type { WalletConfigDocument } from '@/lib/data/types'
import { getMongoDb } from '@/lib/mongodb'

const COLLECTION = 'wallet_configs'
const DEFAULT_REGION = 'global'

export type WalletProviderType = 'apple_pay' | 'google_pay'

export type WalletProviderSettings = {
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

export type WalletOptionsPayload = {
  region: string
  currency: string
  countryCode: string
  fallbackProvider: 'stripe' | 'paystack'
  wallets: Record<WalletProviderType, WalletProviderSettings>
}

const providerDefaults: WalletProviderSettings = {
  enabled: false,
  merchantCapabilities: [],
  supportedNetworks: [],
  environment: 'test',
}

export const walletProviderSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  merchantId: z.string().max(128).optional(),
  merchantName: z.string().max(128).optional(),
  merchantCapabilities: z.array(z.string()).optional(),
  supportedNetworks: z.array(z.string()).optional(),
  countryCode: z.string().length(2).optional(),
  currencyCode: z.string().length(3).optional(),
  gateway: z.string().optional(),
  environment: z.enum(['test', 'production']).optional(),
  minOSVersion: z.string().optional(),
})

export const walletConfigInputSchema = z.object({
  region: z.string().min(2).max(32),
  currency: z.string().length(3).optional(),
  countryCode: z.string().length(2).optional(),
  fallbackProvider: z.enum(['stripe', 'paystack']).optional(),
  applePay: walletProviderSettingsSchema.optional(),
  googlePay: walletProviderSettingsSchema.optional(),
  notes: z.string().max(500).optional(),
})

export type WalletConfigInput = z.infer<typeof walletConfigInputSchema>

export async function listWalletConfigs() {
  const collection = await getWalletConfigCollection()
  return collection.find().sort({ region: 1 }).toArray()
}

export async function getWalletConfig(region?: string) {
  const collection = await getWalletConfigCollection()
  const normalizedRegion = normalizeRegion(region)
  const match = await collection.findOne({ region: normalizedRegion })
  if (match) {
    return match
  }

  if (normalizedRegion !== DEFAULT_REGION) {
    return collection.findOne({ region: DEFAULT_REGION })
  }

  return null
}

export async function upsertWalletConfig(input: WalletConfigInput) {
  const collection = await getWalletConfigCollection()
  const region = normalizeRegion(input.region)
  const now = new Date()

  const payload = {
    region,
    currency: normalizeCurrency(input.currency) ?? 'USD',
    countryCode: normalizeCountry(input.countryCode) ?? 'US',
    fallbackProvider: input.fallbackProvider ?? 'stripe',
    applePay: normalizeProviderSettings(input.applePay),
    googlePay: normalizeProviderSettings(input.googlePay),
    notes: input.notes,
    updatedAt: now,
  }

  await collection.updateOne(
    { region },
    {
      $set: payload,
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  )

  return collection.findOne({ region })
}

export async function resolveWalletOptions(region?: string): Promise<WalletOptionsPayload> {
  const config = await getWalletConfig(region)
  const fallbackRegion = normalizeRegion(region)
  return serializeWalletOptions(config, fallbackRegion)
}

export function serializeWalletOptions(config: WalletConfigDocument | null, fallbackRegion = DEFAULT_REGION): WalletOptionsPayload {
  const applePay = normalizeProviderSettings(config?.applePay)
  const googlePay = normalizeProviderSettings(config?.googlePay)

  return {
    region: config?.region ?? fallbackRegion,
    currency: config?.currency ?? 'USD',
    countryCode: config?.countryCode ?? 'US',
    fallbackProvider: config?.fallbackProvider ?? 'stripe',
    wallets: {
      apple_pay: applePay,
      google_pay: googlePay,
    },
  }
}

export function getProviderAvailability(options: WalletOptionsPayload, provider: WalletProviderType) {
  return options.wallets[provider]
}

function normalizeRegion(region?: string) {
  const value = region?.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  return value && value.trim().length > 0 ? value : DEFAULT_REGION
}

function normalizeCurrency(value?: string) {
  return value ? value.toUpperCase() : undefined
}

function normalizeCountry(value?: string) {
  return value ? value.toUpperCase() : undefined
}

function normalizeProviderSettings(input?: Partial<WalletProviderSettings>): WalletProviderSettings {
  const merged = { ...providerDefaults, ...input }
  return {
    ...merged,
    enabled: input?.enabled ?? providerDefaults.enabled,
    merchantCapabilities: [...(input?.merchantCapabilities ?? providerDefaults.merchantCapabilities)],
    supportedNetworks: [...(input?.supportedNetworks ?? providerDefaults.supportedNetworks)],
    countryCode: normalizeCountry(input?.countryCode ?? merged.countryCode) ?? merged.countryCode,
    currencyCode: normalizeCurrency(input?.currencyCode ?? merged.currencyCode) ?? merged.currencyCode,
    environment: input?.environment ?? providerDefaults.environment,
  }
}

async function getWalletConfigCollection() {
  const db = await getMongoDb()
  return db.collection<WalletConfigDocument>(COLLECTION)
}
