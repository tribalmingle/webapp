import React from 'react'

const ClientShell = React.lazy(() => import('./member-app-shell.client'))

export function MemberAppShell(props: any) {
  return (
    <React.Suspense fallback={<div />}>
      <ClientShell {...props} />
    </React.Suspense>
  )
}
