import { describe, it, expect } from 'vitest'
import { processStripeEvent } from '@/app/api/payments/webhooks/stripe/route'

// Minimal mock Stripe.Event object factory
function mockEvent(type: string, data: any): any {
  return { id: 'evt_' + Math.random().toString(36).slice(2), type, data: { object: data } }
}

describe('Stripe webhook replay handler', () => {
  it('handles payment_intent.succeeded', async () => {
    const event = mockEvent('payment_intent.succeeded', { id: 'pi_test', metadata: { userId: 'u1', purpose: 'coins' }, amount: 500 })
    const res = await processStripeEvent(event)
    expect(res.processed).toBe(true)
  })
  it('handles customer.subscription.deleted', async () => {
    const event = mockEvent('customer.subscription.deleted', { id: 'sub_test', metadata: { userId: 'u2', plan: 'concierge' } })
    const res = await processStripeEvent(event)
    expect(res.processed).toBe(true)
  })
  it('handles invoice.payment_failed', async () => {
    const event = mockEvent('invoice.payment_failed', { id: 'in_test', subscription: 'sub_test', metadata: { userId: 'u3' } })
    const res = await processStripeEvent(event)
    expect(res.processed).toBe(true)
  })
})
