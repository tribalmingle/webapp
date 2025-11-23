import { describe, it, expect } from 'vitest'
import { createStripeIntent, createPaystackCharge, initiateApplePaySession, initiateGooglePaySession } from '@/lib/services/payment-service'

const userId = 'test-user'

describe('PaymentService stubs', () => {
  it('creates a stripe intent stub without key', async () => {
    const intent = await createStripeIntent({ userId, amountCents: 1234, currency: 'USD', purpose: 'subscription' })
    expect(intent.gateway).toBe('stripe')
    expect(intent.amountCents).toBe(1234)
    expect(intent.userId).toBe(userId)
  })

  it('creates a paystack charge stub', async () => {
    const charge = await createPaystackCharge({ userId, amountCents: 5000, currency: 'NGN', purpose: 'coins', email: 'stub@example.com' })
    expect(charge.gateway).toBe('paystack')
    expect(charge.authorizationUrl).toBeTruthy()
  })

  it('initiates apple pay session stub', async () => {
    const session = await initiateApplePaySession({ userId, amountCents: 2500, currency: 'GBP', purpose: 'gift' })
    expect(session.gateway).toBe('apple_pay')
  })

  it('initiates google pay session stub', async () => {
    const session = await initiateGooglePaySession({ userId, amountCents: 2500, currency: 'GBP', purpose: 'boost' })
    expect(session.gateway).toBe('google_pay')
  })
})
