#!/usr/bin/env tsx
// Replay a Stripe event by ID using exported processStripeEvent
import Stripe from 'stripe'
import { processStripeEvent } from '@/app/api/payments/webhooks/stripe/route'

async function run() {
  const eventId = process.argv[2]
  if (!eventId) {
    console.error('Usage: replay-stripe-event <eventId>')
    process.exit(1)
  }
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    console.error('Missing STRIPE_SECRET_KEY env var')
    process.exit(1)
  }
  const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
  const event = await stripe.events.retrieve(eventId)
  await processStripeEvent(event)
  console.log(`Replayed event ${event.id} (${event.type})`) 
}
run().catch(err => { console.error(err); process.exit(1) })
