import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HeroSection } from '@/components/marketing/hero-section'
import type { HeroVariant } from '@/lib/marketing/hero'

const baseVariant: HeroVariant = {
  key: 'default',
  title: 'Connect intentionally',
  highlight: 'with your tribe',
  description: 'Build meaningful relationships.',
  primaryCta: 'Join Tribal Mingle',
  secondaryCta: 'I already have an account',
  tagline: 'Safety-first platform for real people.',
  alignment: 'center',
  direction: 'ltr',
}

describe('HeroSection', () => {
  it('renders hero copy and CTAs', () => {
    render(<HeroSection variant={baseVariant} subcopy="Subcopy" />)

    expect(screen.getByText('Connect intentionally')).toBeInTheDocument()
    expect(screen.getByText('with your tribe')).toBeInTheDocument()
    expect(screen.getByText('Join Tribal Mingle')).toBeInTheDocument()
    expect(screen.getByText('I already have an account')).toHaveAttribute('href', '/login')
  })

  it('matches snapshot', () => {
    const { container } = render(<HeroSection variant={{ ...baseVariant, badge: 'Diaspora' }} subcopy="Subcopy" />)
    expect(container).toMatchSnapshot()
  })
})
