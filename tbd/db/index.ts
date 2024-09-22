import {sql} from 'drizzle-orm'
import {drizzle} from 'drizzle-orm/postgres-js'
import {migrate} from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import {env} from '@openint/env'
import * as schema from './schema'

export * from './schema-dynamic'
export * from './stripeNullByte'
export * from './upsert'

export {schema}

const url = new URL(env.POSTGRES_URL)
if (env.DEBUG) {
  console.log('[db] host', url.host)
}

// TODO: Remove these global variables...
export const pgClient = postgres(env.POSTGRES_URL)
export const db = drizzle(pgClient, {schema, logger: !!env['DEBUG']})

export async function ensureSchema(thisDb: typeof db, schema: string) {
  // Check existence first because we may not have permission to actually create the schema
  const exists = await thisDb
    .execute(
      sql`SELECT true as exists FROM information_schema.schemata WHERE schema_name = ${schema}`,
    )
    .then((r) => r[0]?.['exists'] === true)
  if (exists) {
    return
  }
  await thisDb.execute(
    sql`CREATE SCHEMA IF NOT EXISTS ${sql.identifier(schema)};`,
  )
}

/** Will close the postgres client connection by default */
export async function runMigration(opts?: {keepAlive?: boolean}) {
  console.log('[db] Running migrations...')
  const path = await import('node:path')
  // const fs = await import('node:fs')
  // const url = await import('node:url')

  const schema = env['POSTGRES_SCHEMA']
  if (schema) {
    await ensureSchema(db, schema)
    await db.execute(sql`
      SET search_path TO ${sql.identifier(schema)};
    `)
  }

  // const __filename = url.fileURLToPath(import.meta.url)
  // const __dirname = path.dirname(__filename)
  await migrate(db, {
    migrationsFolder: path.join(__dirname, 'migrations'),
    // Seems to have no impact, and unconditionally creates a drizzle schema... 🤔
    // migrationsTable: '_migrations',
  })

  if (!opts?.keepAlive) {
    await pgClient.end()
  }
}

export * from 'drizzle-orm'
