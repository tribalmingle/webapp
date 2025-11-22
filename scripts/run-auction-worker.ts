import { loadEnvConfig } from '@next/env'
import type { ClearAuctionWindowResult } from '@/lib/boost/auction-worker'

loadEnvConfig(process.cwd())

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2))
    const { clearDueAuctionWindows } = await import('@/lib/boost/auction-worker')
    const results = await clearDueAuctionWindows({ now: args.now })

    if (results.length === 0) {
      console.log('No auction windows were cleared. (All locales disabled or no bids present)')
      return
    }

    console.log(`Cleared ${results.length} auction windows${args.now ? ` using reference time ${args.now.toISOString()}` : ''}.`)
    console.table(results.map(formatSummary))
  } catch (error) {
    console.error('[auction-worker] failed to clear windows', error)
    process.exitCode = 1
  }
}

main()

function parseArgs(argv: string[]) {
  const args: { now?: Date } = {}

  for (const token of argv) {
    if (token.startsWith('--now=')) {
      const value = token.substring('--now='.length)
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid --now value: ${value}`)
      }
      args.now = parsed
    }
  }

  return args
}

function formatSummary(result: ClearAuctionWindowResult) {
  return {
    locale: result.locale,
    placement: result.placement,
    windowStart: result.windowStart.toISOString(),
    winners: result.winnersCleared,
    rollovers: result.rollovers,
    refunds: result.refunded,
    failures: result.failures,
    totalBids: result.totalBids,
  }
}
