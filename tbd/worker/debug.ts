/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  db,
  dbUpsert,
  getCommonObjectTable,
  pgClient,
  sql,
  stripNullByte,
} from '@openint/db'
import args from './debug-input.json'

const sqlNow = sql`now()`

async function main() {
  const table = getCommonObjectTable('crm_contact', {schema: 'supaglue'})
  await dbUpsert(
    db,
    table,
    [
      {
        // Primary keys
        _supaglue_application_id: args[0] as any,
        _supaglue_provider_name: args[1] as any,
        _supaglue_customer_id: args[2] as any, //  '$YOUR_CUSTOMER_ID',
        id: args[3] as any,
        // Other columns
        created_at: sqlNow,
        updated_at: sqlNow,
        _supaglue_emitted_at: sqlNow,
        last_modified_at: sqlNow, // TODO: Fix me...
        is_deleted: args[4] as any,
        // Workaround jsonb support issue... https://github.com/drizzle-team/drizzle-orm/issues/724
        // raw_data: sql`regexp_replace(${args[5] ?? ''}::text, '\\u0000', '', 'g')::jsonb`,
        // raw_data: sql`to_jsonb(${JSON.stringify(args[5] ?? {})}::text)`,
        // raw_data: sql`to_jsonb(${JSON.stringify(args[5] ?? {})}::text)`,
        raw_data: sql`${stripNullByte(args[5]) ?? null}::jsonb`,
        _supaglue_unified_data: sql`${args[6]}::jsonb`,
      },
    ],
    {
      insertOnlyColumns: ['created_at'],
      noDiffColumns: ['_supaglue_emitted_at', 'last_modified_at', 'updated_at'],
    },
  )
  await pgClient.end()
}

void main()
