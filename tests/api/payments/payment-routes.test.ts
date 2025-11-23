import { describe, it, expect } from 'vitest'
import { POST as stripeIntentPost } from '@/app/api/payments/stripe/intent/route'
import { POST as paystackInitPost } from '@/app/api/payments/paystack/initialize/route'
import { GET as paystackVerifyGet } from '@/app/api/payments/paystack/verify/[reference]/route'
import { POST as walletSessionPost } from '@/app/api/payments/wallet-session/route'
import { POST as appleSessionPost } from '@/app/api/payments/apple-pay/session/route'
import { GET as googleConfigGet } from '@/app/api/payments/google-pay/config/route'

// Simple mock for getCurrentUser used in route handlers via global fetch polyfill (NextResponse remains usable)
// We rely on existing auth util; if it throws due to missing env, tests should be adjusted.

function mockRequest(method: string, body?: any, headers?: Record<string,string>) {
  const init: RequestInit = { method, headers: { 'content-type': 'application/json', ...(headers||{}) }, body: body ? JSON.stringify(body) : undefined }
  return new Request('http://localhost/test', init)
}

// NOTE: These tests run in stub mode (no Stripe/Paystack keys expected in CI unit context)

describe('payment route stubs', () => {
  it('creates stripe intent stub when no key', async () => {
    const req = mockRequest('POST', { amountCents: 500, currency: 'USD', purpose: 'subscription' })
    const res = await stripeIntentPost(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.mode).toBe('stub')
    expect(json.intent.gateway).toBe('stripe')
  })

  it('initializes paystack charge stub when no key', async () => {
    const req = mockRequest('POST', { amountCents: 700, currency: 'USD', purpose: 'coins', email: 'test@example.com' })
    const res = await paystackInitPost(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.mode).toBe('stub')
    expect(json.charge.reference).toBeDefined()
  })

  it('creates wallet session (apple)', async () => {
    const req = mockRequest('POST', { provider: 'apple_pay', amountCents: 300, currency: 'USD', purpose: 'gift' })
    const res = await walletSessionPost(req)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.session.gateway).toBe('apple_pay')
  })

  it('creates apple pay merchant session stub', async () => {
    const req = mockRequest('POST', { validationURL: 'https://apple-pay-gateway.apple.com', amountCents: 1000, currency: 'USD', purpose: 'subscription' })
    const res = await appleSessionPost(req)
    const json = await res.json()
    expect(json.session.merchantIdentifier).toContain('merchant')
  })

  it('provides google pay config stub', async () => {
    const req = new Request('http://localhost/test', { method: 'GET' })
    const res = await googleConfigGet(req)
    const json = await res.json()
    expect(json.config.allowedPaymentMethods[0].tokenizationSpecification.parameters.gateway).toBeDefined()
  })
})
