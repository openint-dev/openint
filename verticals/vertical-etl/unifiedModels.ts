import {z} from '@openint/vdk'

// This is a simplified version of the airbyte protocol

const keyPath = z.array(z.string())

export const stream = z.object({
  name: z.string(),
  json_schema: z.record(z.unknown()),
  // default_cursor_field: z.array(z.string()).optional(),
  source_defined_primary_key: z.array(keyPath).optional(),
})

export const record = z.object({
  data: z.unknown(),
  stream: z.string(),
})

export const messageCatalog = z.object({
  streams: z.array(stream),
  type: z.literal('CATALOG'),
})

export const messageRecord = z.object({
  record,
  type: z.literal('RECORD'),
})

export const message = z.discriminatedUnion('type', [
  messageCatalog,
  messageRecord,
])
