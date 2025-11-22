#!/usr/bin/env tsx
import { MongoClient, type Db } from 'mongodb'

import { collections } from '../../lib/data/collections'
import type { CollectionDefinition, IndexDefinition } from '../../lib/data/collection-helpers'

interface CliOptions {
  dryRun: boolean
  dbName?: string
}

const logPrefix = '[ensure-collections]'
const info = (message: string) => console.log(`${logPrefix} ${message}`)
const warn = (message: string) => console.warn(`${logPrefix} ${message}`)

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
  }

  for (const arg of argv) {
    if (arg === '--dry-run' || arg === '-n') {
      options.dryRun = true
    } else if (arg.startsWith('--db=')) {
      options.dbName = arg.split('=')[1]
    } else if (arg === '--help' || arg === '-h') {
      printHelpAndExit()
    }
  }

  return options
}

function printHelpAndExit(code = 0) {
  console.log(`Usage: pnpm tsx scripts/setup/ensure-collections.ts [--dry-run] [--db=name]

Options:
  --dry-run, -n   Only log the operations without applying them.
  --db=name       Override the database name (defaults to MONGODB_DB, URI db, or "tribalmingle").
  --help, -h      Show this help message.`)
  process.exit(code)
}

async function ensureCollection(db: Db, definition: CollectionDefinition<any>, dryRun: boolean) {
  const collectionName = definition.name
  const exists = await db.listCollections({ name: collectionName }, { nameOnly: true }).hasNext()

  if (!exists) {
    if (dryRun) {
      info(`Would create collection ${collectionName}`)
    } else {
      info(`Creating collection ${collectionName}`)
      await db.createCollection(collectionName, {
        validator: definition.validator,
        validationLevel: 'strict',
        validationAction: 'error',
      })
    }
  } else {
    if (dryRun) {
      info(`Would update validator for ${collectionName}`)
    } else {
      info(`Updating validator for ${collectionName}`)
      await db.command({
        collMod: collectionName,
        validator: definition.validator,
        validationLevel: 'strict',
        validationAction: 'error',
      })
    }
  }

  await ensureIndexes(db, definition, dryRun)
}

async function ensureIndexes(db: Db, definition: CollectionDefinition<any>, dryRun: boolean) {
  if (!definition.indexes.length) return

  const collection = db.collection(definition.name)
  const existingIndexes = await collection.indexes()
  const existingByName = new Map(existingIndexes.map((idx) => [idx.name, idx]))

  for (const indexDef of definition.indexes) {
    const name = indexDef.name ?? deriveIndexName(indexDef)
    const alreadyExists = existingByName.has(name)

    if (alreadyExists) {
      continue
    }

    if (dryRun) {
      info(`Would create index ${name} on ${definition.name}`)
      continue
    }

    info(`Ensuring index ${name} on ${definition.name}`)
    await collection.createIndex(indexDef.key as any, {
      name,
      unique: indexDef.unique,
      partialFilterExpression: indexDef.partialFilterExpression,
      expireAfterSeconds: indexDef.expireAfterSeconds,
    })
  }

  for (const idx of existingIndexes) {
    if (idx.name === '_id_') continue
    if (definition.indexes.some((target) => (target.name ?? deriveIndexName(target)) === idx.name)) continue
    warn(`Found unmanaged index ${idx.name} on ${definition.name}`)
  }
}

function deriveIndexName(indexDef: IndexDefinition): string {
  return Object.entries(indexDef.key)
    .map(([field, direction]) => `${field}_${direction}`)
    .join('__')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    throw new Error('MONGODB_URI env var is required')
  }

  const dbName = options.dbName || process.env.MONGODB_DB || extractDbName(mongoUri) || 'tribalmingle'

  info(`Connecting to MongoDB database "${dbName}"${options.dryRun ? ' (dry run)' : ''}`)
  const client = new MongoClient(mongoUri)

  try {
    await client.connect()
    const db = client.db(dbName)

    for (const definition of collections) {
      await ensureCollection(db, definition, options.dryRun)
    }

    info('All collections processed successfully')
  } finally {
    await client.close()
  }
}

function extractDbName(uri: string): string | undefined {
  try {
    const parsed = new URL(uri)
    const pathname = parsed.pathname.replace(/^\//, '')
    return pathname || undefined
  } catch (error) {
    return undefined
  }
}

main().catch((error) => {
  console.error(`${logPrefix} ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
