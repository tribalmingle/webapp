#!/usr/bin/env tsx
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { toCsfleJson } from '../../lib/data/csfle-config'

const outputPath = resolve(process.cwd(), 'infra', 'data', 'csfle-fields.json')
const payload = toCsfleJson()
writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf8')
console.log(`Wrote CSFLE metadata to ${outputPath}`)
