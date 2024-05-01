/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {parseConnectorConfigsFromRawEnv} from '@openint/app-config/connector-envs'
import type {defConnectors} from '@openint/app-config/connectors/connectors.def'
import '@openint/app-config/register.node'
import {makeJwtClient, makeNangoClient} from '@openint/cdk'
import {makeAlphavantageClient} from '@openint/connector-alphavantage'
import {makeHeronClient} from '@openint/connector-heron'
import {makeLunchmoneyClient} from '@openint/connector-lunchmoney'
import {makeMergeClient} from '@openint/connector-merge'
import {makeMootaClient} from '@openint/connector-moota'
import {makeOneBrickClient} from '@openint/connector-onebrick'
// Make this import dynamic at runtime, so we can do
// dynamic-cli plaid ......  or
// OBJ=$pathToPlaid dynamic-cli whatever...
// Or perhaps we can make it into a register and/or loader for nodejs
// much like tsx and others
import {makePlaidClient} from '@openint/connector-plaid'
import {makePostgresClient} from '@openint/connector-postgres'
import {makeRampClient} from '@openint/connector-ramp'
import {makeSaltedgeClient} from '@openint/connector-saltedge'
import {makeStripeClient} from '@openint/connector-stripe'
import {makeTellerClient} from '@openint/connector-teller'
import {makeTogglClient} from '@openint/connector-toggl'
import {makeWiseClient} from '@openint/connector-wise'
import {makeYodleeClient} from '@openint/connector-yodlee'
import {getEnv} from '@openint/env'
import {AirbytePublicSDK} from '@openint/meta-service-airbyte/airbyte-sdk'
import {makePostgresMetaService} from '@openint/meta-service-postgres'
import {initOpenIntSDK} from '@openint/sdk'
import type {ZFunctionMap} from '@openint/util'
import {getEnvVar, R, z, zodInsecureDebug} from '@openint/util'
import type {CliOpts} from './cli-utils'
import {cliFromZFunctionMap} from './cli-utils'

if (getEnvVar('DEBUG_ZOD')) {
  zodInsecureDebug()
}

function env() {
  process.env['_SKIP_ENV_VALIDATION'] = 'true'

  return require('@openint/app-config/env')
    .env as (typeof import('@openint/app-config/env'))['env']
}

function intConfig<T extends keyof typeof defConnectors>(name: T) {
  const config = parseConnectorConfigsFromRawEnv()[name]
  if (!config) {
    throw new Error(`${name} provider is not configured`)
  }
  return config
}

if (require.main === module) {
  type ClientMap = Record<string, () => [ZFunctionMap, CliOpts] | ZFunctionMap>
  const clients: ClientMap = {
    env: () => ({
      ...R.mapValues(env(), (v) => () => v),
      '': () => env(),
    }),
    intConfig: () => ({
      ...R.mapValues(parseConnectorConfigsFromRawEnv(), (v) => () => v),
      '': () => parseConnectorConfigsFromRawEnv(),
    }),
    jwt: () => makeJwtClient({secretOrPublicKey: env().JWT_SECRET!}),
    pg: () => makePostgresClient({databaseUrl: env().POSTGRES_URL}),
    pgMeta: () =>
      makePostgresMetaService({
        databaseUrl: env().POSTGRES_URL,
        viewer: {role: 'system'},
      }) as {},
    plaid: () => makePlaidClient(intConfig('plaid')) as {},
    onebrick: () => makeOneBrickClient(intConfig('onebrick')) as {},
    teller: () => makeTellerClient(intConfig('teller')),
    stripe: () =>
      makeStripeClient({apiKey: process.env['_STRIPE_TEST_SECRET_KEY']!}),
    ramp: () => makeRampClient(intConfig('ramp').oauth),
    wise: () => makeWiseClient(intConfig('wise')),
    toggl: () => makeTogglClient(intConfig('toggl')),
    yodlee: () =>
      makeYodleeClient(
        intConfig('yodlee'),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getEnvVar('YODLEE_CREDS', {json: true}) as any,
      ),
    alphavantage: () => makeAlphavantageClient({apikey: ''}),
    // asana: () => makeAsanaClient({baseURL: ''}),
    lunchmoney: () => makeLunchmoneyClient(intConfig('lunchmoney')),
    moota: () => makeMootaClient(intConfig('moota')),
    // qbo: () => makeQBOClient(intConfig('qbo')),
    saltedge: () => makeSaltedgeClient(intConfig('saltedge')),

    'merge.accounting': () =>
      makeMergeClient({
        apiKey: process.env['_MERGE_TEST_API_KEY'] ?? '',
        accountToken: process.env['_MERGE_TEST_LINKED_ACCOUNT_TOKEN'] ?? '',
      }).accounting,
    'merge.integrations': () =>
      makeMergeClient({
        apiKey: process.env['_MERGE_TEST_API_KEY'] ?? '',
        accountToken: process.env['_MERGE_TEST_LINKED_ACCOUNT_TOKEN'] ?? '',
      }).integrations,
    heron: () => makeHeronClient({apiKey: process.env['_HERON_API_KEY']!}),
    nango: () =>
      makeNangoClient({secretKey: process.env['_NANGO_SECRET_KEY']!}),
    airbyte: () =>
      AirbytePublicSDK({accessToken: process.env['_AIRBYTE_ACCESS_TOKEN']!}),
    sdk: () =>
      initOpenIntSDK({
        headers: {
          'x-apikey': getEnv('VENICE_API_KEY'),
          'x-resource-id': getEnv('VENICE_RESOURCE_ID'),
        },
      }),
  }

  const clientFactory = z
    .enum(Object.keys(clients) as [keyof typeof clients], {
      errorMap: () => ({message: 'Invalid process.env.CLI'}),
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .transform((key) => clients[key]!)
    .parse(getEnvVar('CLI'))

  const [client, opts] = R.pipe(clientFactory(), (r) =>
    Array.isArray(r) ? r : [r],
  )

  cliFromZFunctionMap(client, opts).help().parse()
}
