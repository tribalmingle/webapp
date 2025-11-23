import { describe, it, expect } from 'vitest'
import { graphql } from 'graphql'
import { schema } from '@/lib/graphql/schema'

// Minimal context provider
const context = { userId: 'test-user' }

describe('GraphQL smoke', () => {
  it('fetches subscription info', async () => {
    const query = '{ subscription { plan status } }'
    const res = await graphql({ schema, source: query, contextValue: context })
    expect(res.errors).toBeUndefined()
  })
  it('fetches wallet snapshot', async () => {
    const query = '{ wallet { balance transactions { id type amount } } }'
    const res = await graphql({ schema, source: query, contextValue: context })
    expect(res.errors).toBeUndefined()
  })
  it('fetches referral progress', async () => {
    const query = '{ referralProgress { codes signups verified rewards } }'
    const res = await graphql({ schema, source: query, contextValue: context })
    expect(res.errors).toBeUndefined()
  })
})
