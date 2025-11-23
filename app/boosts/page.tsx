import React from 'react'
import BoostsClient from './boosts-client'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <React.Suspense fallback={<div>Loading boosts…</div>}>
      <BoostsClient />
    </React.Suspense>
  )
}
