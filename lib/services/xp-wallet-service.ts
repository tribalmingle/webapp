/**
 * Phase 6: XP Wallet Service
 * Persistent XP balance and transaction history for gamification rewards
 */

import { getMongoDb } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { withSpan } from '@/lib/observability/tracing'

export interface XpTransaction {
  _id?: ObjectId
  userId: ObjectId
  amount: number
  source: 'quest' | 'event' | 'bonus' | 'admin'
  reference?: string // questId, eventId, etc.
  metadata?: Record<string, any>
  createdAt: Date
}

export interface XpWallet {
  userId: ObjectId
  balance: number
  totalEarned: number
  totalSpent: number
  lastUpdated: Date
}

export class XpWalletService {
  /**
   * Get or create wallet for user
   */
  static async getWallet(userId: string): Promise<XpWallet> {
    return withSpan('xpWallet.getWallet', async () => {
      const db = await getMongoDb()
      const collection = db.collection<XpWallet>('xp_wallets')
      const userObjectId = new ObjectId(userId)

      let wallet = await collection.findOne({ userId: userObjectId })
      
      if (!wallet) {
        const newWallet: XpWallet = {
          userId: userObjectId,
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
          lastUpdated: new Date(),
        }
        await collection.insertOne(newWallet as any)
        wallet = newWallet as any
      }

      return wallet
    }, { userId })
  }

  /**
   * Add XP to wallet
   */
  static async addXp(params: {
    userId: string
    amount: number
    source: XpTransaction['source']
    reference?: string
    metadata?: Record<string, any>
  }): Promise<{ newBalance: number; transaction: XpTransaction }> {
    return withSpan('xpWallet.addXp', async () => {
      const db = await getMongoDb()
      const wallets = db.collection<XpWallet>('xp_wallets')
      const transactions = db.collection<XpTransaction>('xp_transactions')
      const userObjectId = new ObjectId(params.userId)

      // Create transaction
      const transaction: XpTransaction = {
        userId: userObjectId,
        amount: params.amount,
        source: params.source,
        reference: params.reference,
        metadata: params.metadata,
        createdAt: new Date(),
      }
      const txResult = await transactions.insertOne(transaction)
      transaction._id = txResult.insertedId

      // Update wallet
      const result = await wallets.findOneAndUpdate(
        { userId: userObjectId },
        {
          $inc: {
            balance: params.amount,
            totalEarned: params.amount,
          },
          $set: { lastUpdated: new Date() },
          $setOnInsert: { totalSpent: 0 },
        },
        { upsert: true, returnDocument: 'after' }
      )

      return {
        newBalance: result!.balance,
        transaction,
      }
    }, { userId: params.userId, amount: params.amount, source: params.source })
  }

  /**
   * Deduct XP from wallet (for spending)
   */
  static async spendXp(params: {
    userId: string
    amount: number
    reference?: string
    metadata?: Record<string, any>
  }): Promise<{ newBalance: number; transaction: XpTransaction }> {
    return withSpan('xpWallet.spendXp', async () => {
      const db = await getMongoDb()
      const wallets = db.collection<XpWallet>('xp_wallets')
      const transactions = db.collection<XpTransaction>('xp_transactions')
      const userObjectId = new ObjectId(params.userId)

      // Check balance
      const wallet = await this.getWallet(params.userId)
      if (wallet.balance < params.amount) {
        throw new Error('Insufficient XP balance')
      }

      // Create transaction (negative amount)
      const transaction: XpTransaction = {
        userId: userObjectId,
        amount: -params.amount,
        source: 'admin', // spending tracked as admin deduction
        reference: params.reference,
        metadata: params.metadata,
        createdAt: new Date(),
      }
      const txResult = await transactions.insertOne(transaction)
      transaction._id = txResult.insertedId

      // Update wallet
      const result = await wallets.findOneAndUpdate(
        { userId: userObjectId },
        {
          $inc: {
            balance: -params.amount,
            totalSpent: params.amount,
          },
          $set: { lastUpdated: new Date() },
        },
        { returnDocument: 'after' }
      )

      return {
        newBalance: result!.balance,
        transaction,
      }
    }, { userId: params.userId, amount: params.amount })
  }

  /**
   * Get transaction history
   */
  static async getTransactions(userId: string, limit = 50): Promise<XpTransaction[]> {
    return withSpan('xpWallet.getTransactions', async () => {
      const db = await getMongoDb()
      const transactions = db.collection<XpTransaction>('xp_transactions')
      const userObjectId = new ObjectId(userId)

      return transactions
        .find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray()
    }, { userId, limit })
  }

  /**
   * Get wallet snapshot (balance + recent transactions)
   */
  static async getSnapshot(userId: string) {
    return withSpan('xpWallet.getSnapshot', async () => {
      const wallet = await this.getWallet(userId)
      const transactions = await this.getTransactions(userId, 20)

      return {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalSpent: wallet.totalSpent,
        transactions: transactions.map(tx => ({
          id: tx._id!.toString(),
          amount: tx.amount,
          source: tx.source,
          reference: tx.reference,
          createdAt: tx.createdAt,
        }))
      }
    }, { userId })
  }
}
