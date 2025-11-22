import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { FamilyPortalInviteForm } from '@/components/family-portal/invite-form'
import { trackClientEvent } from '@/lib/analytics/client'

vi.mock('@/lib/analytics/client', () => ({
  trackClientEvent: vi.fn(),
}))

describe('FamilyPortalInviteForm', () => {
  it('tracks submissions with locale metadata', () => {
    render(<FamilyPortalInviteForm action="/api/guardian-invites/request" locale="en" regionHint="GH" submitLabel="Invite" />)

    fireEvent.input(screen.getByPlaceholderText('Member full name'), { target: { value: 'Ama' } })
    fireEvent.input(screen.getByPlaceholderText('Trusted friend email or WhatsApp'), { target: { value: 'ama@example.com' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Invite' }).closest('form') as HTMLFormElement)

    expect(trackClientEvent).toHaveBeenCalledWith('family_portal_invite_submitted', expect.objectContaining({
      locale: 'en',
      regionHint: 'GH',
    }))
  })
})
