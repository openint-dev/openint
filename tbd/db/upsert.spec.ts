import {sql} from 'drizzle-orm'
import {
  boolean,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
// import prettier from 'prettier'
// import prettierSql from 'prettier-plugin-sql'
import {configDb} from './'
import {dbUpsert} from './upsert'
const engagement_sequence = pgTable(
  'engagement_sequences',
  {
    _application_id: text('_application_id').notNull(),
    _provider_name: text('_provider_name').notNull(),
    _customer_id: text('_customer_id').notNull(),
    _emitted_at: timestamp('_emitted_at', {
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
    _unified_data: jsonb('_unified_data'),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [
        table._application_id,
        table._provider_name,
        table._customer_id,
        table.id,
      ],
      name: 'engagement_sequence_pkey',
    }),
  }),
)

async function formatSql(sqlString: string) {
  return sqlString
  // return prettier.format(sqlString, {
  //   parser: 'sql',
  //   // plugins: [prettierSql],
  //   // https://github.com/un-ts/prettier/tree/master/packages/sql#sql-in-js-with-prettier-plugin-embed
  //   ['language' as 'filepath' /* workaround type error */]: 'postgresql',
  // })
}

test('upsert query', async () => {
  const query = dbUpsert(
    configDb,
    engagement_sequence,
    [
      {
        _application_id: '$YOUR_APPLICATION_ID',
        _customer_id: 'connectionId', //  '$YOUR_CUSTOMER_ID',
        _provider_name: 'providerConfigKey',
        id: '123',
        last_modified_at: new Date().toISOString(),
        _emitted_at: sql`now()`,
        is_deleted: false,
        // Workaround jsonb support issue... https://github.com/drizzle-team/drizzle-orm/issues/724
        raw_data: sql`${{hello: 1}}::jsonb`,
        _unified_data: sql`${{world: 2}}::jsonb`,
      },
    ],
    {
      shallowMergeJsonbColumns: ['raw_data'],
      noDiffColumns: ['_emitted_at'],
    },
  )
  expect(await formatSql(query?.toSQL().sql ?? '')).toMatchInlineSnapshot(
    `"insert into "engagement_sequences" ("_application_id", "_provider_name", "_customer_id", "_emitted_at", "id", "created_at", "updated_at", "is_deleted", "last_modified_at", "raw_data", "_unified_data") values ($1, $2, $3, now(), $4, default, default, $5, $6, $7::jsonb, $8::jsonb) on conflict ("_application_id","_provider_name","_customer_id","id") do update set "last_modified_at" = excluded.last_modified_at, "_emitted_at" = excluded._emitted_at, "is_deleted" = excluded.is_deleted, "raw_data" = COALESCE("engagement_sequences"."raw_data", '{}'::jsonb) ||excluded.raw_data, "_unified_data" = excluded._unified_data where ("engagement_sequences"."last_modified_at" IS DISTINCT FROM excluded.last_modified_at or "engagement_sequences"."is_deleted" IS DISTINCT FROM excluded.is_deleted or "engagement_sequences"."raw_data" IS DISTINCT FROM excluded.raw_data or "engagement_sequences"."_unified_data" IS DISTINCT FROM excluded._unified_data)"`,
  )
})
