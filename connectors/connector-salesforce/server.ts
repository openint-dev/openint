import type {SalesforceSDK} from '@opensdks/sdk-salesforce'
import {initSalesforceSDK} from '@opensdks/sdk-salesforce'
import type {ConnectorServer} from '@openint/cdk'
import {modifyRequest, PLACEHOLDER_BASE_URL} from '@openint/vdk'
import type {salesforceSchemas} from './def'

export const SALESFORCE_API_VERSION = '59.0'

export const salesforceServer = {
  newInstance: ({fetchLinks}) => {
    const sdk = initSalesforceSDK({
      baseUrl: PLACEHOLDER_BASE_URL,
      links: (defaultLinks) => [
        (req, next) =>
          next(
            modifyRequest(req, {
              url: req.url.replace(
                PLACEHOLDER_BASE_URL,
                PLACEHOLDER_BASE_URL +
                  '/services/data/v' +
                  SALESFORCE_API_VERSION,
              ),
            }),
          ),
        ...fetchLinks,
        ...defaultLinks,
      ],
    })
    // Would be nice if this method was in the salesforce-provider-jsforce file
    return sdk
    // async function getJsForce() {
    //   const creds = await getCredentials()
    //   if (!creds.instance_url || !creds.access_token) {
    //     throw new Error('Missing instance_url or access_token')
    //   }
    //   const conn = new jsforce.Connection({
    //     instanceUrl: creds.instance_url,
    //     accessToken: creds.access_token,
    //     version: SALESFORCE_API_VERSION,
    //     maxRequest: 10,
    //   })
    //   return conn
    // }
    // return {...sdk, getJsForce} satisfies SalesforceSDK
  },
  passthrough: (instance, input) =>
    instance.request(input.method, input.path, {
      headers: input.headers as Record<string, string>,
      params: {query: input.query},
      body: JSON.stringify(input.body),
    }),
} satisfies ConnectorServer<typeof salesforceSchemas, SalesforceSDK>

export default salesforceServer
