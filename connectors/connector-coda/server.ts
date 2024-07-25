import type {CodaSDK} from '@opensdks/sdk-coda'
import {initCodaSDK} from '@opensdks/sdk-coda'
import type {ConnectorServer} from '@openint/cdk'
import type {codaSchemas} from './def'

export const codaServer = {
  newInstance({settings}) {
    return initCodaSDK({headers: {Authorization: `Bearer ${settings.apiKey}`}})
  },

  passthrough(instance, input) {
    const headers = new Headers(input.headers as Record<string, string>)
    headers.delete('authorization') // Do not allow this to be overwritten
    return instance.request(input.method, input.path, {
      headers,
      params: {query: input.query},
      body: JSON.stringify(input.body),
    })
  },
} satisfies ConnectorServer<typeof codaSchemas, CodaSDK>

export default codaServer
