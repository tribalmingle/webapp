import { redirect } from 'next/navigation'

import { DEFAULT_LOCALE } from '../lib/i18n/locales'

export default function RootLandingRedirect() {
  redirect(`/${DEFAULT_LOCALE}`)
}
