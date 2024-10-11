/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import type {DatabasePool} from 'slonik'
import {sql} from 'slonik'
import type {ConnectorServer} from '@openint/cdk'
import {handlersLink} from '@openint/cdk'
import {R, Rx, rxjs, snakeCase} from '@openint/util'
import type {postgresSchemas} from './def'
import {postgresHelpers} from './def'
import {makePostgresClient, upsertByIdQuery} from './makePostgresClient'

async function setupTable({
  pool,
  schema: _schema,
  tableName: _tableName,
}: {
  pool: DatabasePool
  schema?: string
  tableName: string
}) {
  const schema = snakeCase(_schema)
  const tableName = snakeCase(_tableName)
  const table = sql.identifier(schema ? [schema, tableName] : [tableName])

  await pool.query(sql`
    CREATE TABLE IF NOT EXISTS ${table} (
      connection_id VARCHAR NOT NULL,
      id VARCHAR NOT NULL,
      "clientId" VARCHAR,
      "createdAt" timestamp with time zone DEFAULT now() NOT NULL,
      "updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
      connector_name VARCHAR GENERATED ALWAYS AS (split_part((connection_id)::text, '_'::text, 2)) STORED NOT NULL,
      CONSTRAINT ${sql.identifier([
        `pk_${tableName}`,
      ])} PRIMARY KEY ("connection_id", "id"),
      unified jsonb,
      raw jsonb DEFAULT '{}'::jsonb NOT NULL,
      "isOpenInt" boolean DEFAULT true NOT NULL
    );
  `)
  // NOTE: Should we add org_id?
  // NOTE: Rename `unified` to `unified` and `raw` to `raw` or `remote` or `original`
  // NOTE: add prefix check would be nice
  for (const col of [
    'id',
    'connection_id',
    'connector_name',
    'createdAt',
    'updatedAt',
    'clientId',
  ]) {
    await pool.query(sql`
      CREATE INDEX IF NOT EXISTS ${sql.identifier([
        `${tableName}_${col}`,
      ])} ON ${table} (${sql.identifier([col])});
    `)
  }
}

export const postgresServer = {
  // TODO:
  // 1) Implement pagination
  // 2) Impelemnt incremental Sync
  // 3) Improve type safety
  // 4) Implement parallel runs
  sourceSync: ({
    endUser,
    settings: {databaseUrl, sourceQueries},
    state = {},
  }) => {
    const {getPool} = makePostgresClient({databaseUrl})
    // TODO: Never let slonik transform the field names...
    const rawClient = makePostgresClient({
      databaseUrl,
      transformFieldNames: false,
    })

    async function* iterateEntities() {
      const handlebars = await import('handlebars')

      const pool = await getPool()
      // Where do we want to put data? Not always public...
      await setupTable({pool, tableName: 'account'})
      await setupTable({pool, tableName: 'transaction'})

      for (const entityName of ['account', 'transaction'] as const) {
        const res = await pool.query<{
          id: string
          createdAt: string
          updatedAt: string
          "clientId": string | null
          connector_name: string
          connection_id: string | null
          raw: any
          unified: any
        }>(
          sql`SELECT * FROM ${sql.identifier([
            entityName,
          ])} WHERE "clientId" = ${endUser?.id ?? null}`,
        )
        yield res.rows.map((row) =>
          postgresHelpers._op('data', {
            data: {
              entityName,
              entity: row.unified,
              raw: row.raw,
              id: row.id,
              connectorName: 'postgres',
              connection_id: row.connection_id ?? undefined,
            },
          }),
        )
      }

      const rawPool = await rawClient.getPool()
      for (const [_entityName, _query] of Object.entries(sourceQueries ?? {})) {
        const entityName = _entityName as keyof NonNullable<
          typeof sourceQueries
        >
        const queryState = state[_entityName as keyof typeof state]
        if (!_query) {
          return
        }
        // If schema is known, we can use prepared statements instead. But in this case
        // we do not know the schema
        const query = handlebars.compile(_query)({
          ...queryState,
          endUserId: endUser?.id,
        })

        const res = await rawPool.query<{id?: string; modifiedAt?: string}>(
          rawClient.sql([query] as unknown as TemplateStringsArray),
        )
        const lastRow = res.rows[res.rows.length - 1]

        yield R.compact([
          ...res.rows.map((row) =>
            postgresHelpers._op('data', {
              data: {
                entityName,
                id: `${row.id}`,
                entity: row,
                connectorName: 'postgres', // is this right?
              },
            }),
          ),
          lastRow?.modifiedAt &&
            lastRow.id &&
            (postgresHelpers._opState({
              invoice: {
                lastModifiedAt: lastRow.modifiedAt,
                lastRowId: lastRow.id,
              },
            }) as never), // Temp hack...
        ])
      }
    }

    return rxjs
      .from(iterateEntities())
      .pipe(
        Rx.mergeMap((ops) =>
          rxjs.from([...ops, postgresHelpers._op('commit')]),
        ),
      )
  },
  destinationSync: ({endUser, source, settings: {databaseUrl}}) => {
    console.log('[destinationSync] Will makePostgresClient', {
      // databaseUrl,
      // migrationsPath: __dirname + '/migrations',
      endUser,
    })
    // TODO: Probably need to require these sql files to work... turn them into js files

    const {getPool} = makePostgresClient({
      databaseUrl,
      migrationsPath: __dirname + '/migrations',
      migrationTableName: '_migrations',
    })
    let batches: Record<string, Array<{id: string; [k: string]: unknown}>> = {}

    const migrationRan: Record<string, boolean> = {}
    async function runMigration(pool: DatabasePool, tableName: string) {
      console.log('will run migration for', tableName)
      if (migrationRan[tableName]) {
        return
      }
      migrationRan[tableName] = true
      // Where do we want to put data? Not always public...
      await setupTable({pool, tableName})
    }

    return handlersLink({
      data: (op) => {
        const {
          data: {id, entityName, ...data},
        } = op
        const tableName = entityName
        const batch = batches[tableName] ?? []
        batches[tableName] = batch

        batch.push({
          // This is really not ideal. Maybe this should be a resource level seteting
          // about how we want to "normalize"?
          // Or be provided by the Operation itself?
          ...(typeof data.entity === 'object' &&
          data.entity &&
          'raw' in data.entity
            ? {...data.entity}
            : {raw: data.entity}),
          id,
          clientId: endUser?.id ?? null,
          connection_id: source?.id,
        })
        return rxjs.of(op)
      },
      commit: async (op) => {
        const size = R.values(batches)
          .map((b) => b.length)
          .reduce((a, b) => a + b, 0)
        if (size === 0) {
          return op
        }
        const pool = await getPool()
        await Promise.all(
          Object.keys(batches).map((eName) => runMigration(pool, eName)),
        )

        console.log(`[postgres] Will commit ${size} entities`)
        await pool.transaction((client) =>
          Promise.all(
            R.pipe(
              batches,
              R.toPairs,
              R.map(([eName, batch]) =>
                upsertByIdQuery(eName, batch, {
                  primaryKey: ['id', 'connection_id'],
                }),
              ),
              R.compact,
              R.map((query) => {
                // TODO: remove when we introduce dynamic column names 
                // Replace all instances inconsistent column names before execution
               
                const columnMappings = [
                  { from: 'client_id', to: 'clientId' },
                  { from: 'created_at', to: 'createdAt' },
                  { from: 'updated_at', to: 'updatedAt' },
                  { from: 'is_open_int', to: 'isOpenInt' }
                ];
                
                let sqlQuery = query.sql;
                // Use a for loop to replace all camelCase column names with snake_case
                for (const mapping of columnMappings) {
                  const regex = new RegExp(`"${mapping.from}"`, 'g');
                  sqlQuery = sqlQuery.replace(regex, `"${mapping.to}"`);
                }
                // Use the finalQuery for the database operation
                return client.query({
                  sql: sqlQuery,
                  values: query.values,
                  type: query.type
                })
              }),
            ),
          ),
        )
        batches = {}
        console.log(`[postgres] Did commit ${size} entities`)
        return op
      },
    })
  },
} satisfies ConnectorServer<typeof postgresSchemas>

export default postgresServer
