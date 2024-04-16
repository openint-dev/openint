import type {InfoFromPaths} from '@openint/util'
import {makeOpenApiClient} from '@openint/util'
import type {paths} from './heron.gen'

/** https://docs.herondata.io/authentication */
export function makeHeronClient(opts: {apiKey: string}) {
  const baseUrl = 'https://app.herondata.io'
  const client = makeOpenApiClient<InfoFromPaths<paths>>({
    baseUrl,
    auth: {basic: {username: '', password: opts.apiKey}},
  })
  return client
}
