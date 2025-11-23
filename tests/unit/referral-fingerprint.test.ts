import { describe, it, expect } from 'vitest'
import { createReferralCode, recordEvent, getReferralFingerprintSignals } from '@/lib/services/referral-service'

describe('Referral fingerprint fraud signals', () => {
  it('aggregates fingerprint events and produces risk score', async () => {
    const refUser = 'ref-user'
    const code = await createReferralCode(refUser)
    for (let i = 0; i < 5; i++) {
      await recordEvent(code.code, 'clicked', { fingerprint: 'fp-123', ip: '1.1.1.1' })
    }
    const signals = getReferralFingerprintSignals()
    const fp = signals.find(s => s.fingerprint === 'fp-123')
    expect(fp).toBeDefined()
    expect(fp!.eventCount).toBeGreaterThanOrEqual(5)
    expect(fp!.riskScore).toBeGreaterThan(0)
  })
})
