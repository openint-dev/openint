import {initGreenhouseSDK, type greenhouseTypes} from '@opensdks/sdk-greenhouse'
import type {ConnectorServer} from '@openint/cdk'
import {Rx, rxjs, z} from '@openint/util'
import {type greenhouseSchema} from './def'

export type GreenhouseSDK = ReturnType<typeof initGreenhouseSDK>

export type GreenhouseTypes = greenhouseTypes

export type GreenhouseObjectType = GreenhouseTypes['components']['schemas']

export const greenhouseServer = {
  newInstance: ({settings}) => {
    const greenhouse = initGreenhouseSDK({
      auth: {basic: {username: settings.apiKey, password: ''}},
    })
    return greenhouse
  },
  sourceSync: ({instance: greenhouse, streams, state}) =>
    observableFromEtlSource(
      greenhouseSource({sdk: greenhouse}),
      streams,
      (state ?? {}) as {},
    ),
} satisfies ConnectorServer<
  typeof greenhouseSchema,
  ReturnType<typeof initGreenhouseSDK>
>

export default greenhouseServer

// MARK: - New way of doing things

interface EtlSource<
  TEntityMap extends Record<string, unknown> = Record<string, unknown>,
> {
  listEntities<TK extends keyof TEntityMap>(
    type: TK,
    options: {
      cursor?: string | null
      page_size?: number
    },
  ): Promise<{
    entities: Array<{
      id: string
      /** `null` means deleted */
      data: TEntityMap[TK] | null
    }>
    next_cursor: string | null
    has_next_page: boolean
  }>
}

interface CursorParser<T> {
  fromString: (cursor: string | undefined | null) => T
  toString: (value: T) => string | null
}

const NextPageCursor: CursorParser<{next_page: number}> = {
  fromString(cursor) {
    const num = z.coerce.number().positive().safeParse(cursor)
    return {next_page: num.success ? num.data : 1}
  },
  toString(value) {
    return JSON.stringify(value)
  },
}

// TODO: Implement incremental sync
// https://developers.greenhouse.io/harvest.html#get-list-jobs
// TODO2: Implement low-code connector spec
function greenhouseSource({sdk}: {sdk: GreenhouseSDK}): EtlSource<{
  job: GreenhouseObjectType['job']
  // candidate: GreenhouseObjectType['candidate']
  // application: GreenhouseObjectType['application']
  // opening: GreenhouseObjectType['opening']
  // offer: GreenhouseObjectType['offer']
}> {
  return {
    // Perhaps allow cursor implementation to be passed in as a parameter
    async listEntities(type, {cursor}) {
      const {next_page: page} = NextPageCursor.fromString(cursor)
      const res = await sdk.GET(`/v1/${type as 'job'}s`, {
        params: {query: {per_page: 50, page}},
      })

      return {
        entities: res.data.map((j) => ({id: `${j.id}`, data: j})),
        next_cursor: NextPageCursor.toString({next_page: page + 1}),
        // TODO: instead check for count / from respnose header
        has_next_page: res.data.length === 0,
      }
    },
  }
}

function observableFromEtlSource(
  source: EtlSource,
  streams: Record<string, boolean | {disabled?: boolean | undefined} | null>,
  state: Record<string, {cursor?: string | null}> = {},
) {
  async function* iterateEntities() {
    for (const streamName of Object.keys(streams)) {
      const streamValue = streams[streamName]
      if (
        !streamValue ||
        (streamValue as {disabled: boolean}).disabled === true
        // Should further check weather streamName is valid for a given connector
      ) {
        continue
      }

      const {cursor} = state[streamName] ?? {}
      const {entities, next_cursor, has_next_page} = await source.listEntities(
        streamName,
        {cursor},
      )

      yield entities.map((j) => ({
        type: 'data' as const,
        // We should make the messages easier to construct
        data: {entityName: streamName, id: j.id, entity: j.data},
      }))

      state[streamName] = {cursor: next_cursor}
      if (!has_next_page) {
        continue
      }
    }
  }
  // DO somethign with the new state...

  return rxjs
    .from(iterateEntities())
    .pipe(Rx.mergeMap((ops) => rxjs.from([...ops, {type: 'commit' as const}])))
}
