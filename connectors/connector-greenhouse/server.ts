import {initGreenhouseSDK, type greenhouseTypes} from '@opensdks/sdk-greenhouse'
import type {ConnectorServer} from '@openint/cdk'
import {Rx, rxjs, snakeCase} from '@openint/util'
import {
  GREENHOUSE_ENTITY_NAMES,
  greenhouseHelpers,
  type greenhouseSchema,
} from './def'

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
  sourceSync: ({instance: greenhouse, streams}) => {
    async function* iterateEntities() {
      // const updatedSince = undefined
      // TODO: Inplement incremental sync...
      console.log('[qbo] Starting sync', streams)
      for (const type of Object.values(GREENHOUSE_ENTITY_NAMES)) {
        if (!streams[type]) {
          continue
        }

        const res = await greenhouse.GET('/v1/jobs')
        yield res.data.map((j) =>
          greenhouseHelpers._opData(snakeCase(type), `${j.id}`, j),
        )
      }
    }

    return rxjs
      .from(iterateEntities())
      .pipe(
        Rx.mergeMap((ops) =>
          rxjs.from([...ops, greenhouseHelpers._op('commit')]),
        ),
      )
  },
} satisfies ConnectorServer<
  typeof greenhouseSchema,
  ReturnType<typeof initGreenhouseSDK>
>

export default greenhouseServer
