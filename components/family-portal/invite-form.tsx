'use client'

import { ArrowRight } from 'lucide-react'
import { FormEvent, useCallback } from 'react'

import { trackClientEvent } from '@/lib/analytics/client'

type Props = {
  action: string
  locale: string
  regionHint: string
  submitLabel: string
}

export function FamilyPortalInviteForm({ action, locale, regionHint, submitLabel }: Props) {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      trackClientEvent('family_portal_invite_submitted', {
        locale,
        regionHint,
        hasContext: Boolean((event.currentTarget.elements.namedItem('context') as HTMLTextAreaElement | null)?.value?.trim()),
      })
    },
    [locale, regionHint],
  )

  return (
    <form className="mt-8 grid gap-4 md:grid-cols-2" action={action} method="post" onSubmit={handleSubmit}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="regionHint" value={regionHint} />
      <input
        type="text"
        name="memberName"
        placeholder="Member full name"
        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-none"
        required
      />
      <input
        type="email"
        name="contact"
        placeholder="Trusted friend email or WhatsApp"
        className="w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-none"
        required
      />
      <textarea
        name="context"
        placeholder="Share any cultural or safety preferences (optional)"
        className="md:col-span-2 h-28 w-full rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:border-white focus:outline-none"
      />
      <button
        type="submit"
        className="md:col-span-2 inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-primary shadow-lg transition hover:opacity-90"
      >
        {submitLabel}
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  )
}
