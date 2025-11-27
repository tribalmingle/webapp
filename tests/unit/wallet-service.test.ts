import { describe, it, expect, beforeEach } from 'vitest'
import { 
  getBalance, 
  credit, 
  debit, 
  listTransactions, 
  getSnapshot,
  type WalletTransaction 
} from '@/lib/services/wallet-service'

describe('WalletService', () => {
  const userId = 'wallet-user-' + Date.now()

  describe('Balance operations', () => {
    it('initializes balance at 0 for new user', async () => {
      const balance = await getBalance(userId + '-new')
      expect(balance).toBe(0)
    })

    it('credits wallet and updates balance', async () => {
      const userId1 = userId + '-credit1'
      const balance1 = await credit(userId1, 100, 'test-credit')
      expect(balance1).toBe(100)
      const balance2 = await credit(userId1, 50)
      expect(balance2).toBe(150)
    })

    it('debits wallet and updates balance', async () => {
      const userId2 = userId + '-debit1'
      await credit(userId2, 200)
      const balance = await debit(userId2, 75, 'test-debit')
      expect(balance).toBe(125)
    })

    it('throws error when debiting with insufficient balance', async () => {
      const userId3 = userId + '-insufficient'
      await credit(userId3, 50)
      await expect(async () => {
        await debit(userId3, 100)
      }).rejects.toThrow('Insufficient balance')
    })

    it('rejects negative credit amounts', async () => {
      const userId4 = userId + '-negative-credit'
      await expect(async () => {
        await credit(userId4, -50)
      }).rejects.toThrow('Credit amount must be positive')
    })

    it('rejects negative debit amounts', async () => {
      const userId5 = userId + '-negative-debit'
      await expect(async () => {
        await debit(userId5, -25)
      }).rejects.toThrow('Debit amount must be positive')
    })

    it('rejects zero credit', async () => {
      const userId6 = userId + '-zero-credit'
      await expect(async () => {
        await credit(userId6, 0)
      }).rejects.toThrow('Credit amount must be positive')
    })

    it('rejects zero debit', async () => {
      const userId7 = userId + '-zero-debit'
      await expect(async () => {
        await debit(userId7, 0)
      }).rejects.toThrow('Debit amount must be positive')
    })
  })

  describe('Transaction history', () => {
    it('records credit transactions', async () => {
      const userId8 = userId + '-tx-credit'
      await credit(userId8, 100, 'reward')
      await credit(userId8, 50, 'bonus')
      const transactions = await listTransactions(userId8)
      expect(transactions.length).toBeGreaterThanOrEqual(2)
      const creditTxs = transactions.filter(t => t.type === 'credit')
      expect(creditTxs.length).toBe(2)
      expect(creditTxs.some(t => t.reference === 'reward')).toBe(true)
      expect(creditTxs.some(t => t.reference === 'bonus')).toBe(true)
    })

    it('records debit transactions', async () => {
      const userId9 = userId + '-tx-debit'
      await credit(userId9, 200)
      await debit(userId9, 75, 'purchase')
      const transactions = await listTransactions(userId9)
      const debitTxs = transactions.filter(t => t.type === 'debit')
      expect(debitTxs.length).toBe(1)
      expect(debitTxs[0].reference).toBe('purchase')
      expect(debitTxs[0].amount).toBe(75)
    })

    it('returns transactions in descending order by creation time', async () => {
      const userId10 = userId + '-tx-order'
      await credit(userId10, 100, 'first')
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))
      await credit(userId10, 50, 'second')
      await new Promise(resolve => setTimeout(resolve, 10))
      await debit(userId10, 25, 'third')
      
      const transactions = await listTransactions(userId10)
      expect(transactions.length).toBeGreaterThanOrEqual(3)
      // Most recent should be first (debit 'third')
      expect(transactions[0].reference).toBe('third')
      expect(transactions[0].type).toBe('debit')
    })

    it('returns empty array for user with no transactions', async () => {
      const transactions = await listTransactions(userId + '-no-tx')
      expect(transactions).toEqual([])
    })
  })

  describe('Idempotency', () => {
    it('prevents duplicate credits with same idempotency key', async () => {
      const userId11 = userId + '-idempotent-credit'
      const key = 'credit-idem-' + Date.now()
      const balance1 = await credit(userId11, 100, 'reward', key)
      expect(balance1).toBe(100)
      // Second call with same key should not credit again
      const balance2 = await credit(userId11, 100, 'reward', key)
      expect(balance2).toBe(100) // Should remain same
    })

    it('prevents duplicate debits with same idempotency key', async () => {
      const userId12 = userId + '-idempotent-debit'
      await credit(userId12, 200)
      const key = 'debit-idem-' + Date.now()
      const balance1 = await debit(userId12, 50, 'purchase', key)
      expect(balance1).toBe(150)
      // Second call with same key should not debit again
      const balance2 = await debit(userId12, 50, 'purchase', key)
      expect(balance2).toBe(150) // Should remain same
    })

    it('allows different operations with different idempotency keys', async () => {
      const userId13 = userId + '-different-keys'
      await credit(userId13, 100, 'reward1', 'key1')
      await credit(userId13, 100, 'reward2', 'key2')
      const balance = await getBalance(userId13)
      expect(balance).toBe(200)
    })
  })

  describe('Snapshot retrieval', () => {
    it('returns complete snapshot with balance and transactions', async () => {
      const userId14 = userId + '-snapshot'
      await credit(userId14, 100, 'initial')
      await credit(userId14, 50, 'bonus')
      await debit(userId14, 25, 'spend')
      
      const snapshot = await getSnapshot(userId14)
      expect(snapshot.balance).toBe(125)
      expect(snapshot.transactions.length).toBeGreaterThanOrEqual(3)
    })

    it('returns zero balance and empty transactions for new user', async () => {
      const snapshot = await getSnapshot(userId + '-empty-snapshot')
      expect(snapshot.balance).toBe(0)
      expect(snapshot.transactions).toEqual([])
    })
  })

  describe('Complex transaction scenarios', () => {
    it('handles multiple concurrent credits correctly', async () => {
      const userId15 = userId + '-concurrent-credit'
      await Promise.all([
        credit(userId15, 100, 'source1'),
        credit(userId15, 100, 'source2'),
        credit(userId15, 100, 'source3'),
      ])
      const balance = await getBalance(userId15)
      expect(balance).toBe(300)
    })

    it('handles sequential credit and debit operations', async () => {
      const userId16 = userId + '-sequential'
      await credit(userId16, 1000)
      await debit(userId16, 250)
      await credit(userId16, 500)
      await debit(userId16, 100)
      const balance = await getBalance(userId16)
      expect(balance).toBe(1150) // 1000 - 250 + 500 - 100
    })

    it('maintains transaction integrity across operations', async () => {
      const userId17 = userId + '-integrity'
      await credit(userId17, 100, 'ref1')
      await debit(userId17, 25, 'ref2')
      await credit(userId17, 50, 'ref3')
      
      const transactions = await listTransactions(userId17)
      const balance = await getBalance(userId17)
      
      // Balance should match sum of transactions
      const calculatedBalance = transactions.reduce((sum, tx) => {
        return tx.type === 'credit' ? sum + tx.amount : sum - tx.amount
      }, 0)
      expect(balance).toBe(calculatedBalance)
      expect(balance).toBe(125)
    })
  })
})
