import type {SalesforceSDK} from '@opensdks/sdk-salesforce'
import {initSalesforceSDK} from '@opensdks/sdk-salesforce'
import type {ConnectorServer} from '@openint/cdk'
import {nangoProxyLink} from '@openint/cdk'
import type {salesforceSchemas} from './def'

export const salesforceServer = {
  newInstance: ({settings, fetchLinks}) => {
    const sdk = initSalesforceSDK({
      // We rely on nango to refresh the access token...
      headers: {
        authorization: `Bearer ${settings.oauth.credentials.access_token}`,
      },
      links: (defaultLinks) => [
        (req, next) => {
          if (sdk.clientOptions.baseUrl) {
            req.headers.set(
              nangoProxyLink.kBaseUrlOverride,
              sdk.clientOptions.baseUrl,
            )
          }
          return next(req)
        },
        ...fetchLinks,
        ...defaultLinks,
      ],
    })
    return sdk
  },
  passthrough: (instance, input) =>
    instance.request(input.method, input.path, {
      headers: input.headers as Record<string, string>,
      params: {query: input.query},
      body: JSON.stringify(input.body),
    }),
} satisfies ConnectorServer<typeof salesforceSchemas, SalesforceSDK>

export default salesforceServer
