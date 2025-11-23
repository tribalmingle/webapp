import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { applyEntitlementsForPayment } from '@/lib/services/payment-service'
import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data?: {
    status: string
    amount: number
    currency: string
    reference: string
  }
}

export async function GET(_request: Request, { params }: { params: { reference: string } }) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })

  const paystackKey = process.env.PAYSTACK_SECRET_KEY
  if (!paystackKey) {
    return NextResponse.json({ success: false, error: 'Paystack key not configured' }, { status: 500 })
  }

  try {
    const resp = await fetch(`https://api.paystack.co/transaction/verify/${params.reference}`, {
      headers: { 'Authorization': `Bearer ${paystackKey}` },
    })
    const json: PaystackVerifyResponse = await resp.json()
    if (!resp.ok || !json.status || !json.data) {
      return NextResponse.json({ success: false, error: json.message || 'Verification failed' }, { status: 502 })
    }
    // Update payment status + entitlements if succeeded
    if (json.data.status === 'success') {
      try {
        const db = await getMongoDb()
        const payment = await db.collection('payments').findOne({ providerPaymentId: json.data.reference })
        if (payment) {
          await db.collection('payments').updateOne({ _id: payment._id }, { $set: { status: 'succeeded', updatedAt: new Date() } })
          const purpose = payment.lineItems?.[0]?.description || 'subscription'
          const userId = payment.userId?.toString()
          if (userId) {
            await applyEntitlementsForPayment(purpose, userId, payment.amount?.valueCents || json.data.amount, payment.metadata)
          }
        }
      } catch {}
    }
    return NextResponse.json({ success: true, verification: { reference: json.data.reference, status: json.data.status, amount: json.data.amount, currency: json.data.currency }, mode: 'live' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Paystack verify error'
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
