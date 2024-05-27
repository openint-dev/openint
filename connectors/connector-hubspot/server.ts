import {initHubspotSDK, type HubspotSDK} from '@opensdks/sdk-hubspot'
import type {ConnectorServer} from '@openint/cdk'
import type {hubspotSchemas} from './def'

export const hubspotServer = {
  newInstance: ({fetchLinks, settings}) =>
    initHubspotSDK({
      headers: {
        authorization: `Bearer ${settings.oauth.credentials.access_token}`,
      },
      links: (defaultLinks) => [...fetchLinks, ...defaultLinks],
    }),
  // passthrough: (instance, input) =>
  //   instance.request(input.method, input.path, {
  //     headers: input.headers as Record<string, string>,
  //     params: {query: input.query},
  //     body: JSON.stringify(input.body),
  //   }),
} satisfies ConnectorServer<typeof hubspotSchemas, HubspotSDK>

export default hubspotServer
