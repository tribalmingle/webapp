import { describe, it, expect } from 'vitest'
import { FeatureFlagService } from '@/lib/services/feature-flag-service'

describe('FeatureFlagService', () => {
  const testFlagKey = 'test_feature_' + Date.now()

  describe('createFlag', () => {
    it('should create a new feature flag', async () => {
      const flagId = await FeatureFlagService.createFlag({
        key: testFlagKey,
        name: 'Test Feature',
        description: 'Test flag',
        enabled: false,
        rolloutPercentage: 0,
        createdBy: 'test',
      })

      expect(flagId).toBeDefined()
      expect(typeof flagId).toBe('string')
    })
  })

  describe('getFlag', () => {
    it('should retrieve a flag by key', async () => {
      const flag = await FeatureFlagService.getFlag(testFlagKey)

      expect(flag).toBeDefined()
      expect(flag?.key).toBe(testFlagKey)
      expect(flag?.enabled).toBe(false)
    })
  })

  describe('toggleFlag', () => {
    it('should toggle flag on and off', async () => {
      await FeatureFlagService.toggleFlag(testFlagKey)
      let flag = await FeatureFlagService.getFlag(testFlagKey)
      expect(flag?.enabled).toBe(true)

      await FeatureFlagService.toggleFlag(testFlagKey)
      flag = await FeatureFlagService.getFlag(testFlagKey)
      expect(flag?.enabled).toBe(false)
    })
  })

  describe('isEnabled', () => {
    it('should return false when flag is disabled', async () => {
      const enabled = await FeatureFlagService.isEnabled(testFlagKey, 'user123')
      expect(enabled).toBe(false)
    })

    it('should respect rollout percentage', async () => {
      await FeatureFlagService.updateFlag(testFlagKey, {
        enabled: true,
        rolloutPercentage: 50,
      })

      // Test with 100 different users - roughly 50% should be enabled
      const results = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          FeatureFlagService.isEnabled(testFlagKey, `user${i}`)
        )
      )

      const enabledCount = results.filter(Boolean).length
      expect(enabledCount).toBeGreaterThan(30)
      expect(enabledCount).toBeLessThan(70)
    })

    it('should always enable at 100% rollout', async () => {
      await FeatureFlagService.updateFlag(testFlagKey, {
        enabled: true,
        rolloutPercentage: 100,
      })

      const results = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          FeatureFlagService.isEnabled(testFlagKey, `user${i}`)
        )
      )

      expect(results.every(Boolean)).toBe(true)
    })
  })

  describe('getVariant', () => {
    it('should return null when no variants', async () => {
      const variant = await FeatureFlagService.getVariant(testFlagKey, 'user123')
      expect(variant).toBeNull()
    })

    it('should distribute variants by weight', async () => {
      const abTestKey = 'ab_test_' + Date.now()
      await FeatureFlagService.createFlag({
        key: abTestKey,
        name: 'A/B Test',
        enabled: true,
        rolloutPercentage: 100,
        variants: [
          { key: 'control', name: 'Control', weight: 50 },
          { key: 'treatment', name: 'Treatment', weight: 50 },
        ],
        createdBy: 'test',
      })

      const results = await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          FeatureFlagService.getVariant(abTestKey, `user${i}`)
        )
      )

      const controlCount = results.filter(v => v === 'control').length
      const treatmentCount = results.filter(v => v === 'treatment').length

      expect(controlCount).toBeGreaterThan(30)
      expect(treatmentCount).toBeGreaterThan(30)
    })
  })
})
