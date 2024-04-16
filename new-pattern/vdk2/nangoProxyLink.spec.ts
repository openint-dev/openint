/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable jest/no-standalone-expect */
import {initSDK, logLink} from '@opensdks/runtime'
import outreachSdkDef from '@opensdks/sdk-outreach'
import {env} from '@openint/env'
import {nangoProxyLink} from './nangoProxyLink'

const maybeTest = env.NANGO_SECRET_KEY ? test : test.skip

maybeTest('get outreach accounts', async () => {
  const client = initSDK(outreachSdkDef, {
    headers: {authorization: 'Bearer ...'},

    links: (defaultLinks) => [
      logLink(),
      // base url override link
      (req, next) => {
        if (client.clientOptions.baseUrl) {
          req.headers.set(
            nangoProxyLink.kBaseUrlOverride,
            client.clientOptions.baseUrl,
          )
        }
        return next(req)
      },
      nangoProxyLink({
        secretKey: env.NANGO_SECRET_KEY!,
        connectionId: env.CONNECTION_ID!,
        providerConfigKey: env.PROVIDER_CONFIG_KEY!,
      }),
      ...defaultLinks,
    ],
  })

  const res = await client.GET('/accounts', {})
  expect(res.response.status).toEqual(200)
})
