import { z } from 'zod'
import { ObjectId } from 'mongodb'

export const objectIdSchema = z.instanceof(ObjectId)

export function withTimestamps<T extends z.ZodRawShape>(shape: T) {
  return z.object({
    ...shape,
    createdAt: z.date(),
    updatedAt: z.date(),
  })
}

export type IndexDirection = 1 | -1 | 'text'

export type IndexDefinition = {
  key: Record<string, IndexDirection>
  name?: string
  unique?: boolean
  partialFilterExpression?: Record<string, unknown>
  expireAfterSeconds?: number
}

export type MongoJsonSchema = {
  bsonType: 'object'
  required?: string[]
  additionalProperties?: boolean
  properties: Record<string, unknown>
}

export type CollectionDefinition<TSchema extends z.ZodTypeAny> = {
  name: string
  schema: TSchema
  validator: { $jsonSchema: MongoJsonSchema }
  indexes: IndexDefinition[]
}

export function buildJsonSchema(
  properties: Record<string, unknown>,
  required: string[] = [],
  options: { allowAdditionalProperties?: boolean } = {},
): { $jsonSchema: MongoJsonSchema } {
  const baseProperties = {
    ...properties,
    createdAt: { bsonType: 'date', description: 'Document creation timestamp' },
    updatedAt: { bsonType: 'date', description: 'Document last update timestamp' },
  }

  return {
    $jsonSchema: {
      bsonType: 'object',
      required: Array.from(new Set([...required, 'createdAt', 'updatedAt'])),
      additionalProperties: options.allowAdditionalProperties ?? false,
      properties: baseProperties,
    },
  }
}
