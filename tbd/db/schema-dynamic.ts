import {sql} from 'drizzle-orm'
// NOTE: Introduce schema name also?
import {
  boolean,
  jsonb,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

export const mySchema = pgSchema('my_schema')

/**
 * Supaglue inconsistently pluralized table names... Only did it for common objects too not standard objects...
 * @see https://github.com/supaglue-labs/supaglue/blob/d482ca9468b8047c0fa874b77a38ab765dc5e9c3/packages/core/destination_writers/postgres.ts#L373-L393
 */
function pluralizeCommonObjectName(name: string) {
  switch (name) {
    case 'crm_opportunity':
      return 'crm_opportunities'
    case 'engagement_mailbox':
      return 'engagement_mailboxes'
    case 'crm_account':
    case 'crm_contact':
    case 'crm_lead':
    case 'crm_user':
    case 'engagement_account':
    case 'engagement_contact':
    case 'engagement_sequence_state':
    case 'engagement_sequence_step':
    case 'engagement_user':
    case 'engagement_sequence':
      return `${name}s`
    default:
      return name
  }
}

/** e.g. crm_accounts */
export function getCommonObjectTable<TName extends string>(
  _tableName: TName,
  opts: {schema?: string} = {},
) {
  const schema = opts.schema ? pgSchema(opts.schema) : undefined
  const tableName = pluralizeCommonObjectName(_tableName)
  const table = (schema ? schema.table : pgTable)(
    tableName,
    {
      _supaglue_application_id: text('_supaglue_application_id').notNull(),
      _supaglue_provider_name: text('_supaglue_provider_name').notNull(),
      _supaglue_customer_id: text('_supaglue_customer_id').notNull(),
      _supaglue_emitted_at: timestamp('_supaglue_emitted_at', {
        precision: 3,
        mode: 'string',
      }).notNull(),
      id: text('id').notNull(),
      created_at: timestamp('created_at', {precision: 3, mode: 'string'}),
      updated_at: timestamp('updated_at', {precision: 3, mode: 'string'}),
      is_deleted: boolean('is_deleted').default(false).notNull(),
      last_modified_at: timestamp('last_modified_at', {
        precision: 3,
        mode: 'string',
      }).notNull(),
      raw_data: jsonb('raw_data'),
      _supaglue_unified_data: jsonb('_supaglue_unified_data'),
    },
    (table) => ({
      primaryKey: primaryKey({
        columns: [
          table._supaglue_application_id,
          table._supaglue_provider_name,
          table._supaglue_customer_id,
          table.id,
        ],
        name: `${tableName}_pkey`,
      }),
    }),
  )
  // Workaround for https://github.com/drizzle-team/drizzle-orm/discussions/1901
  // To get this statement use pnpm db:generate-from-meta result and copy paste output to here... then replace...
  const _schema = opts.schema ? sql.raw(`"${opts.schema}".`) : sql.raw('')
  const _table = sql.raw(tableName)
  const extension = {
    createIfNotExistsSql: () => sql`
      CREATE TABLE IF NOT EXISTS ${_schema}"${_table}" (
        "_supaglue_application_id" text NOT NULL,
        "_supaglue_provider_name" text NOT NULL,
        "_supaglue_customer_id" text NOT NULL,
        "_supaglue_emitted_at" timestamp(3) NOT NULL,
        "id" text NOT NULL,
        "created_at" timestamp(3),
        "updated_at" timestamp(3),
        "is_deleted" boolean DEFAULT false NOT NULL,
        "last_modified_at" timestamp(3) NOT NULL,
        "raw_data" jsonb,
        "_supaglue_unified_data" jsonb,
        CONSTRAINT "${_table}_pkey" PRIMARY KEY("_supaglue_application_id","_supaglue_provider_name","_supaglue_customer_id","id")
      );
    `,
  }
  Object.assign(table, extension)
  return table as typeof table & typeof extension
}

/** e.g. salesforce_contact, also `custom_objects` too...  */
export function getProviderObjectTable<TName extends string>(
  _tableName: TName,
  opts: {custom?: boolean; schema?: string} = {},
) {
  const schema = opts.schema ? pgSchema(opts.schema) : undefined
  // Supaglue put all custom objects into a single table... so we need to handle that too...
  const tableName = opts.custom ? 'custom_objects' : _tableName
  const table = (schema ? schema.table : pgTable)(
    tableName,
    {
      _supaglue_application_id: text('_supaglue_application_id').notNull(),
      _supaglue_provider_name: text('_supaglue_provider_name').notNull(),
      _supaglue_customer_id: text('_supaglue_customer_id').notNull(),
      _supaglue_id: text('_supaglue_id').notNull(),
      _supaglue_emitted_at: timestamp('_supaglue_emitted_at', {
        precision: 3,
        mode: 'string',
      }).notNull(),
      _supaglue_last_modified_at: timestamp('_supaglue_last_modified_at', {
        precision: 3,
        mode: 'string',
      }).notNull(),
      _supaglue_is_deleted: boolean('_supaglue_is_deleted')
        .default(false)
        .notNull(),
      _supaglue_raw_data: jsonb('_supaglue_raw_data'),
      _supaglue_mapped_data: jsonb('_supaglue_mapped_data'),
      // e.g. salesforce_product_gaps_c , or hubspot_productgaps
      ...(opts?.custom && {
        _supaglue_object_name: text('_supaglue_object_name').notNull(),
      }),
    },
    (table) => ({
      primaryKey: primaryKey({
        columns: [
          table._supaglue_application_id,
          table._supaglue_provider_name,
          table._supaglue_customer_id,
          table._supaglue_id,
        ],
        name: `${tableName}_pkey`,
      }),
    }),
  )
  return table
}

// NOTE: the following tables are dynamically generated and depends on the incoming data, and in this case they are only used as sample fo copy & pasting
// drizzle migration generate commands depends on the snapshot json
// while db push command depends on the database state
// what we probably need is to dynamically write to schema.ts somehow and parse the output of the db:push command with --strict flag
// and then execute that... a lot of work but may be ok for dynamic schema migration like this...
// We would also need to parse the output of db:generate and store those in the db / put back onto disk from db if we want it to work properly
// So bottom line is hacking around migrations is probably the best way to go esp considering production Supaglue never handled migration
// beyond initial creation anyways...

export const crm_account = getCommonObjectTable('crm_account')
export const engagement_sequence = getCommonObjectTable('engagement_sequence')
export const salesforce_account = getProviderObjectTable('salesforce_account')
export const custom_objects = getProviderObjectTable('hubspot_productgaps', {
  custom: true,
})
