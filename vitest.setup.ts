import '@testing-library/jest-dom/vitest'
import React from 'react'

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string | { pathname?: string } }) => {
    const resolvedHref = typeof href === 'string' ? href : href?.pathname || '#'
    return React.createElement('a', { href: resolvedHref, ...rest }, children)
  },
}))
