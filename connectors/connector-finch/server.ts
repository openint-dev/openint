import type {FinchSDK} from '@opensdks/sdk-finch'
import {initFinchSDK} from '@opensdks/sdk-finch'
import type {ConnectorServer} from '@usevenice/cdk'
import type {finchSchemas} from './def'

export const finchServer = {
  newInstance: ({settings, config}) =>
    initFinchSDK({
      headers: {
        'FINCH-API-VERSION': config.api_version ?? '2020-09-17',
        // This is the connection specific version of the API
        // Use basic for access that is not client specific...
        authorization: `Bearer ${settings.access_token}`,
      },
    }),
  // sourceSync: ({instance, streams, state}) => {
  //   async function* iterateRecords() {
  //     for (const stream of Object.keys(streams ?? {}).filter(
  //       (s) => !!streams[s as keyof typeof streams],
  //     )) {
  //       const sState = (state as Record<string, unknown>)[stream] ?? {}
  //       yield* iterateRecordsInStream(stream, sState)
  //     }
  //   }

  //   async function* iterateRecordsInStream(
  //     stream: string,
  //     /** stream state */
  //     sState: {cursor?: string | null},
  //   ) {
  //     const plural = finchPluralize(stream)
  //     let cursor = sState.cursor
  //     while (true) {
  //       const res = await instance.GET(`/crm/${plural as 'companies'}`, {
  //         params: {query: {cursor}},
  //       })
  //       yield res.data.results.map((com) =>
  //         helpers._opData(stream as 'company', com.id ?? '', com),
  //       )
  //       cursor = res.data.next
  //       if (!cursor) {
  //         break
  //       }
  //     }
  //   }
  //   return rxjs
  //     .from(iterateRecords())
  //     .pipe(Rx.mergeMap((ops) => rxjs.from([...ops, helpers._op('commit')])))
  // },
  passthrough: (instance, input) =>
    instance.request(input.method, input.path, {
      params: {query: input.query},
      headers: new Headers((input.headers ?? {}) as Record<string, string>),
      body: input.body,
    }),
} satisfies ConnectorServer<typeof finchSchemas, FinchSDK>

export default finchServer
