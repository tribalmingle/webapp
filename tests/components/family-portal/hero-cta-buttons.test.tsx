import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FamilyPortalHeroCtas } from '@/components/family-portal/hero-cta-buttons'
import { trackClientEvent } from '@/lib/analytics/client'

vi.mock('@/lib/analytics/client', () => ({
  trackClientEvent: vi.fn(),
}))

describe('FamilyPortalHeroCtas', () => {
  it('emits events for primary and secondary CTAs', () => {
    render(
      <FamilyPortalHeroCtas
        locale="en"
        primaryLabel="Invite"
        secondaryLabel="Learn more"
        primaryTarget="#invite"
        secondaryTarget="#trust"
      />,
    )

    fireEvent.click(screen.getByText('Invite'))
    fireEvent.click(screen.getByText('Learn more'))

    expect(trackClientEvent).toHaveBeenNthCalledWith(1, 'family_portal_cta_click', {
      locale: 'en',
      cta: 'primary',
      target: '#invite',
    })
    expect(trackClientEvent).toHaveBeenNthCalledWith(2, 'family_portal_cta_click', {
      locale: 'en',
      cta: 'secondary',
      target: '#trust',
    })
  })
})
