/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable jest/no-standalone-expect */
import {jest} from '@jest/globals'
import {initSDK, logLink} from '@opensdks/runtime'
import apolloSdkDef from '@opensdks/sdk-apollo'
import outreachSdkDef from '@opensdks/sdk-outreach'
import {testEnv} from '@openint/env'
import {supaglueProxyLink} from './supaglueProxyLink'

jest.setTimeout(30 * 1000)

const maybeTest = testEnv.SUPAGLUE_API_KEY ? test : test.skip

maybeTest('get outreach accounts', async () => {
  const client = initSDK(outreachSdkDef, {
    headers: {authorization: 'Bearer ...'},

    links: (defaultLinks) => [
      logLink(),
      supaglueProxyLink({
        apiKey: testEnv.SUPAGLUE_API_KEY!,
        customerId: testEnv.CUSTOMER_ID!,
        providerName: 'outreach',
      }),
      ...defaultLinks,
    ],
  })

  const res = await client.GET('/accounts', {})
  expect(res.response.status).toEqual(200)
})

maybeTest('get apollo accounts', async () => {
  const client = initSDK(apolloSdkDef, {
    api_key: '',
    links: (defaultLinks) => [
      logLink(),
      ...defaultLinks.slice(0, -1),
      // Suapglue proxy link should be the final link before terminating link
      supaglueProxyLink({
        apiKey: testEnv.SUPAGLUE_API_KEY!,
        customerId: testEnv.CUSTOMER_ID!,
        providerName: 'apollo',
      }),
      // Only want the final terminating link here
      // TODO: Figure out how to clean up the links input to avoid this issue for future
      ...defaultLinks.slice(-1),
    ],
  })
  // console.log('client', client.links)

  const res = await client.GET('/v1/email_accounts', {})
  expect(res.response.status).toEqual(200)
})
