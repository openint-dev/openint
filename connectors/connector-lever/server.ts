import {initLeverSDK, type leverTypes} from '@opensdks/sdk-lever'
import type {ConnectorServer} from '@openint/cdk'
import {type leverSchemas} from './def'
import {EtlSource, NextPageCursor, observableFromEtlSource} from '../connector-common'

export type LeverSDK = ReturnType<typeof initLeverSDK>

export type LeverTypes = leverTypes

export type LeverObjectType = LeverTypes['components']['schemas']

export const leverServer = {
  newInstance: ({config, settings}) => {
    const lever = initLeverSDK({
      headers: {
        authorization: `Bearer ${settings.oauth.credentials.access_token}`,
      },
      envName: config.envName,
    })
    return lever
  },
  sourceSync: ({instance: lever, streams, state}) =>
    observableFromEtlSource(
      leverSource({sdk: lever}),
      streams,
      (state ?? {}) as {},
    ),
} satisfies ConnectorServer<
  typeof leverSchemas,
  ReturnType<typeof initLeverSDK>
>

export default leverServer

// TODO: Implement incremental sync
// TODO2: Implement low-code connector spec
function leverSource({sdk}: {sdk: LeverSDK}): EtlSource<{
  posting: LeverObjectType['posting']
  // Add other entity types as needed
}> {
  return {
    async listEntities(type, {cursor}) {
      const {next_page: page} = NextPageCursor.fromString(cursor)
      const res = await sdk.GET(`/${type as 'posting'}s`, {
        params: {query: {limit: 50, offset: cursor ?? undefined}},
      })

      return {
        entities: res.data.data.map((e) => ({id: `${e.id}`, data: e})),
        next_cursor: NextPageCursor.toString({next_page: page + 1}),
        has_next_page: res.data.hasNext ?? false,
      }
    },
  }
}
