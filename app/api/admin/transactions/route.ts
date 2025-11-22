import { NextRequest, NextResponse } from 'next/server'
import { ensureAdminRequest } from '@/lib/admin/auth'
import { getMongoDb } from '@/lib/mongodb'

export async function GET(req: NextRequest) {
  const auth = ensureAdminRequest(req)
  if ('response' in auth) {
    return auth.response
  }

  try {
    const db = await getMongoDb()
    const transactionsCollection = db.collection('transactions')

    // Get recent transactions
    const transactions = await transactionsCollection
      .find({})
      .sort({ date: -1 })
      .limit(100)
      .toArray()

    const enrichedTransactions = transactions.map(transaction => ({
      ...transaction,
      _id: transaction._id.toString()
    }))

    return NextResponse.json({ success: true, transactions: enrichedTransactions })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    // Return empty array if collection doesn't exist yet
    return NextResponse.json({ success: true, transactions: [] })
  }
}
