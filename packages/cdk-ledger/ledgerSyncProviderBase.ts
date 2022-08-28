import {
  AnyProviderDef,
  AnySyncProvider,
  makeSyncProvider,
  Source,
} from '@ledger-sync/cdk-core'
import {z} from '@ledger-sync/util'
import {EntityPayload, zEntityPayload} from './entity-link-types'

// NEXT: add institution, etc.

type _opt<T> = T | undefined

/**
 * TODO: Narrow the type of AnyProviderDef to only those whose `sourceSyncOptions`
 * and `destinationInputEntity` match the type needed for ledgerSync
 */
export const ledgerSyncProviderBase = <
  T extends AnyProviderDef,
  TSourceMapEntity extends _opt<
    // Simpler
    | Partial<{
        [k in T['_types']['sourceOutputEntity']['entityName']]: (
          entity: Extract<T['_types']['sourceOutputEntity'], {entityName: k}>,
          settings: T['_types']['connectionSettings'],
        ) => EntityPayload | null
      }>
    // More powerful
    | ((
        entity: T['_types']['sourceOutputEntity'],
        settings: T['_types']['connectionSettings'],
      ) => EntityPayload | null)
  >,
>(
  def: T,
  extension: {
    sourceMapEntity: TSourceMapEntity
    getInstitutions?: (
      config: T['_types']['integrationConfig'],
    ) => Source<T['_types']['sourceOutputEntity']>
  },
) => makeSyncProvider({...makeSyncProvider.defaults, def, extension})

ledgerSyncProviderBase.def = makeSyncProvider.def({
  ...makeSyncProvider.def.defaults,
  sourceSyncOptions: z
    .object({
      /** Account ids to sync */
      accountIds: z.array(z.string()).nullish(),
      /** Date to sync since */
      sinceDate: z.string().nullish() /** ISO8601 */,
    })
    .default({}),
  // How do we omit destination defs for source only providers and vice versa?
  destinationInputEntity: zEntityPayload,
})

export type LedgerSyncProvider = ReturnType<typeof ledgerSyncProviderBase>

export function isLedgerSyncProvider(
  provider: AnySyncProvider,
): provider is LedgerSyncProvider {
  return typeof provider.extension === 'object' && provider.extension
    ? 'sourceMapEntity' in provider.extension
    : false
}