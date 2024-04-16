import {or, sql} from 'drizzle-orm'
import {
  getTableConfig,
  type PgColumn,
  type PgDatabase,
  type PgInsertValue,
  type PgTable,
  type PgUpdateSetSource,
} from 'drizzle-orm/pg-core'

type ColumnKeyOf<T extends PgTable> = Extract<keyof T['_']['columns'], string>

/** We assume that every row contains the same keys even if not defined in its value */
export function dbUpsert<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DB extends PgDatabase<any, any>,
  TTable extends PgTable,
>(
  db: DB,
  table: TTable,
  values: Array<PgInsertValue<TTable>>,
  options: {
    /** defaults to primaryKeyColumns */
    keyColumns?: Array<ColumnKeyOf<TTable>>
    /** Shallow jsonb merge as via sql`COALESCE(${fullId}, '{}'::jsonb) || excluded.${colId}` */
    shallowMergeJsonbColumns?: Array<ColumnKeyOf<TTable>>
    /**
     * Changes to these columns will be ignored in the WHERE clause of ON CONFLICT UPDATE
     * e.g. `updated_at`
     */
    noDiffColumns?: Array<ColumnKeyOf<TTable>>
    // TODO: Add onlyDiffColumns to be symmetrical with noDiffColumns
    /**
     * These columns will only be inserted but never updated. e.g. `created_at`
     * keyColumns are always insertOnly by nature and do not need to be repeated here
     */
    insertOnlyColumns?: Array<ColumnKeyOf<TTable>>
  } = {},
) {
  const tbCfg = getTableConfig(table)
  const getColumn = (name: string) => {
    const col = table[name as keyof PgTable] as PgColumn
    if (!col) {
      throw new Error(`Column ${name} not found in table ${tbCfg.name}`)
    }
    return col
  }

  const keyColumns =
    options.keyColumns?.map(getColumn) ??
    tbCfg.primaryKeys[0]?.columns ??
    tbCfg.columns.filter((c) => c.primary) // Presumably only a single primary key column will be possible in this scenario
  const shallowMergeJsonbColumns =
    options.shallowMergeJsonbColumns?.map(getColumn)
  const noDiffColumns = options.noDiffColumns?.map(getColumn)
  const insertOnlyColumns = options.insertOnlyColumns?.map(getColumn)

  if (!keyColumns) {
    throw new Error(
      `Unable to upsert without keyColumns for table ${tbCfg.name}`,
    )
  }
  const insertOnlyColumnNames = new Set([
    ...keyColumns.map((k) => k.name),
    ...(insertOnlyColumns?.map((k) => k.name) ?? []),
  ])
  const updateColumns = Object.fromEntries(
    Object.keys(values[0] ?? {})
      .map((k) => [k, getColumn(k)] as const)
      .filter(([, c]) => !insertOnlyColumnNames.has(c.name)),
  )
  return db
    .insert(table)
    .values(values)
    .onConflictDoUpdate({
      target: keyColumns,
      set: Object.fromEntries(
        Object.entries(updateColumns).map(([k, c]) => [
          k,
          sql.join([
            shallowMergeJsonbColumns?.find((jc) => jc.name === c.name)
              ? sql`COALESCE(${c}, '{}'::jsonb) ||`
              : sql``,
            sql.raw(`excluded.${c.name}`),
          ]),
        ]),
      ) as PgUpdateSetSource<TTable>,
      where: or(
        ...Object.values(updateColumns)
          .filter((c) => !noDiffColumns?.find((ic) => ic.name === c.name))
          .map(
            // In PostgreSQL, the "IS DISTINCT FROM" operator is used to compare two values and determine
            // if they are different, even if they are both NULL. On the other hand, the "!=" operator
            // (also known as "not equals") compares two values and returns true if they are different,
            // but treats NULL as an unknown value and does not consider it as different from other values.
            (c) => sql`${c} IS DISTINCT FROM ${sql.raw(`excluded.${c.name}`)}`,
          ),
      ),
    })
}
