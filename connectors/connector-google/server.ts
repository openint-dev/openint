import {initGoogleSDK} from '@opensdks/sdk-google'
import type {ConnectorServer} from '@openint/cdk'
import type {googleSchemas} from './def'

export const googleServer = {
  newInstance: ({settings}) => {
    const sdk = initGoogleSDK({
      headers: {
        authorization: `Bearer ${settings.oauth.credentials.access_token}`,
      },
    })
    return sdk?.drive_v3
  },

  async proxy(instance, req) {
    return instance
      .request(req.method as 'GET', req.url.replace(/.+\/api\/proxy/, ''), {
        headers: req.headers,
        ...(!['GET', 'OPTIONS', 'HEAD'].includes(req.method) && {
          body: await req.blob(),
        }),
      })
      .then((r: any) => r.response.clone())
  },
} satisfies ConnectorServer<typeof googleSchemas>

export default googleServer
