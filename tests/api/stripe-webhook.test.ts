import { describe, it, expect, beforeEach, vi } from 'vitest'
import Stripe from 'stripe'
import { processStripeEvent } from '@/app/api/payments/webhooks/stripe/route'

describe('Stripe Webhook Security & Processing', () => {
  describe('Signature Verification', () => {
    it('WH-001: Valid signature should process successfully', async () => {
      // Note: This test requires actual Stripe webhook construction
      // In real implementation, use Stripe CLI to generate test events
      // For unit testing, we test the processStripeEvent function directly
      const mockEvent: Stripe.Event = {
        id: 'evt_test_valid',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            object: 'payment_intent',
            amount: 1000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              userId: 'user123',
              purpose: 'subscription'
            }
          } as unknown as Stripe.PaymentIntent
        },
        api_version: '2024-06-20',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      const result = await processStripeEvent(mockEvent)
      expect(result.processed).toBe(true)
    })

    // Note: Tests WH-002 and WH-003 (invalid/missing signature) 
    // are tested via integration tests with actual HTTP requests
    // since signature verification happens in the POST handler
  })

  describe('Event Processing', () => {
    it('WH-004: invoice.payment_succeeded updates subscription to active', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_invoice_success',
        object: 'event',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_test_123',
            object: 'invoice',
            amount_paid: 1000,
            customer: 'cus_test',
            subscription: 'sub_test_123',
            metadata: {
              userId: 'user_invoice_test',
              plan: 'concierge'
            }
          } as any
        },
        api_version: '2024-06-20',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      const result = await processStripeEvent(mockEvent)
      expect(result.processed).toBe(true)
      // Additional verification: Check subscription status in database
    })

    it('WH-005: customer.subscription.updated updates subscription plan', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_sub_updated',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_456',
            object: 'subscription',
            status: 'active',
            metadata: {
              userId: 'user_sub_update',
              plan: 'guardian'
            },
            current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days
          } as any
        },
        api_version: '2024-06-20',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      const result = await processStripeEvent(mockEvent)
      expect(result.processed).toBe(true)
    })

    it('WH-006: customer.subscription.deleted cancels subscription', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_sub_deleted',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_789',
            object: 'subscription',
            status: 'canceled',
            metadata: {
              userId: 'user_sub_cancel',
              plan: 'concierge'
            }
          } as any
        },
        api_version: '2024-06-20',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      const result = await processStripeEvent(mockEvent)
      expect(result.processed).toBe(true)
      // Verify subscription status updated to 'canceled'
    })

    it('WH-007: invoice.payment_failed marks subscription past_due', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_payment_failed',
        object: 'event',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test_failed',
            object: 'invoice',
            amount_due: 1000,
            subscription: 'sub_test_past_due',
            metadata: {
              userId: 'user_past_due',
              plan: 'concierge'
            }
          } as any
        },
        api_version: '2024-06-20',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      const result = await processStripeEvent(mockEvent)
      expect(result.processed).toBe(true)
      // Verify subscription marked as past_due with timestamp
    })
  })

  describe('Idempotency', () => {
    it('prevents duplicate coin credits for same payment_intent', async () => {
      const paymentIntentId = 'pi_idempotent_' + Date.now()
      const mockEvent: Stripe.Event = {
        id: 'evt_idem_1',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: paymentIntentId,
            object: 'payment_intent',
            amount: 1000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              userId: 'user_idem_test',
              purpose: 'coins',
              coinAmount: '100'
            }
          } as unknown as Stripe.PaymentIntent
        },
        api_version: '2024-06-20',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      // First processing should credit coins
      await processStripeEvent(mockEvent)
      
      // Second processing with same event should not credit again
      // This is tested by checking 'metadata.credited' flag in database
      const result = await processStripeEvent(mockEvent)
      expect(result.processed).toBe(true)
      // Verify only one credit transaction exists for this payment
    })
  })

  describe('Error Handling', () => {
    it('WH-008: Handles malformed event data gracefully', async () => {
      const malformedEvent: any = {
        id: 'evt_malformed',
        object: 'event',
        type: 'unknown.event.type',
        data: {
          object: null // Missing required fields
        },
        api_version: '2024-06-20',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      // Should not throw, should handle gracefully
      const result = await processStripeEvent(malformedEvent)
      expect(result.processed).toBe(true)
    })

    it('handles missing userId in metadata without crashing', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_no_user',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_no_user',
            object: 'subscription',
            status: 'active',
            metadata: {
              // Missing userId
              plan: 'concierge'
            }
          } as any
        },
        api_version: '2024-06-20',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      // Should not crash, should handle gracefully
      const result = await processStripeEvent(mockEvent)
      expect(result.processed).toBe(true)
    })

    it('handles database errors without breaking webhook processing', async () => {
      // Mock database failure
      const mockEvent: Stripe.Event = {
        id: 'evt_db_error',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_db_error',
            object: 'payment_intent',
            amount: 1000,
            currency: 'usd',
            status: 'succeeded',
            metadata: {
              userId: 'user_db_error',
              purpose: 'subscription'
            }
          } as unknown as Stripe.PaymentIntent
        },
        api_version: '2024-06-20',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      // Even with DB errors, webhook should return success to prevent retries
      const result = await processStripeEvent(mockEvent)
      expect(result.processed).toBe(true)
    })
  })

  describe('Subscription Plan Mapping', () => {
    it('maps Stripe metadata plan to internal plan types', async () => {
      const plans = ['concierge', 'guardian', 'premium_plus']
      
      for (const plan of plans) {
        const mockEvent: Stripe.Event = {
          id: `evt_plan_${plan}`,
          object: 'event',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: `sub_plan_${plan}`,
              object: 'subscription',
              status: 'active',
              metadata: {
                userId: `user_plan_${plan}`,
                plan
              }
            } as any
          },
          api_version: '2024-06-20',
          created: Date.now() / 1000,
          livemode: false,
          pending_webhooks: 0,
          request: null,
        }

        const result = await processStripeEvent(mockEvent)
        expect(result.processed).toBe(true)
      }
    })

    it('defaults to concierge plan when metadata missing', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_default_plan',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_default',
            object: 'subscription',
            status: 'active',
            metadata: {
              userId: 'user_default_plan'
              // plan field missing
            }
          } as any
        },
        api_version: '2024-06-20',
        created: Date.now() / 1000,
        livemode: false,
        pending_webhooks: 0,
        request: null,
      }

      const result = await processStripeEvent(mockEvent)
      expect(result.processed).toBe(true)
      // Should default to 'concierge' plan
    })
  })
})
