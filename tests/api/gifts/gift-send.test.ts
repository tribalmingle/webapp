import { describe, it, expect } from 'vitest'
import { sendGift } from '@/lib/services/gift-service'
import { credit, getBalance } from '@/lib/services/wallet-service'

describe('Gift sending', () => {
  it('debits wallet when sending a gift', async () => {
    const sender = 'sender-user'
    const recipient = 'recipient-user'
    await credit(sender, 100, 'initial')
    const before = await getBalance(sender)
    const record = await sendGift({ senderUserId: sender, recipientUserId: recipient, giftId: 'rose' })
    expect(record.giftId).toBe('rose')
    const after = await getBalance(sender)
    expect(after).toBe(before - record.coinsSpent)
  })
})
