import {generateOpenApiDocument} from '@lilyrose2798/trpc-openapi'
import type {
  ZodOpenApiComponentsObject,
  ZodOpenApiPathsObject,
} from '@lilyrose2798/trpc-openapi/dist/generator'
import {env} from '@openint/env'
import {eventsMap} from '@openint/events'
import {mgmtRouter} from '@openint/mgmt'
import {publicProcedure, trpc, zByosHeaders} from '@openint/vdk'
import {crmRouter} from '@openint/vertical-crm'
import {salesEngagementRouter} from '@openint/vertical-sales-engagement'
import {mapKeys, mapValues} from 'remeda'
// not sure about directly depending on vdk from api, but anyways
import {z} from '@opensdks/util-zod'

const publicRouter = trpc.router({
  health: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/health',
        summary: 'Health check',
      },
    })
    .input(z.void())
    .output(z.string())
    .query(() => 'Ok as of ' + new Date().toISOString()),
  getOpenAPISpec: publicProcedure
    .meta({openapi: {method: 'GET', path: '/openapi.json'}})
    .input(z.void())
    .output(z.unknown())
    .query((): unknown => getOpenAPISpec()),
})

export const appRouter = trpc.router({
  public: publicRouter,
  mgmt: mgmtRouter,
  salesEngagement: salesEngagementRouter,
  crm: crmRouter,
})

export function oasWebhooksEventsMap(
  eMap: Record<string, {data: z.AnyZodObject}>,
) {
  const webhooks = mapValues(
    eMap,
    (_, name): ZodOpenApiPathsObject[string] => ({
      post: {
        requestBody: {
          content: {
            'application/json': {
              schema: {$ref: `#/components/schemas/webhooks.${name}`},
            },
          },
        },
        responses: {},
      },
    }),
  )
  type Schemas = NonNullable<ZodOpenApiComponentsObject['schemas']>
  const components = {
    schemas: mapKeys(
      mapValues(eMap, (shape, name): Schemas[string] =>
        z.object({...shape, name: z.literal(name), id: z.string().optional()}),
      ),
      (name) => `webhooks.${name}`,
    ),
  }
  return {webhooks, components}
}

export function getOpenAPISpec() {
  const {webhooks, components} = oasWebhooksEventsMap(eventsMap)
  const oas = generateOpenApiDocument(appRouter, {
    openApiVersion: '3.1.0', // Want jsonschema
    title: 'Bulid your own Supaglue',
    version: '0.0.0',
    // Can we get env passed in instead of directly using it?
    baseUrl: new URL('/api', getServerUrl({})).toString(),
    // TODO: add the security field to specify what methods are required.
    securitySchemes: mapValues(zByosHeaders.shape, (_, key) => ({
      name: key,
      type: 'apiKey',
      in: 'header',
    })),
    webhooks,
    components,
  })
  return oas
}

export function getServerUrl(opts: {req?: Request}) {
  return (
    (typeof window !== 'undefined' &&
      `${window.location.protocol}//${window.location.host}`) ||
    (opts.req &&
      `${
        opts.req.headers.get('x-forwarded-proto') || 'http'
      }://${opts.req.headers.get('host')}`) ||
    (env['NEXT_PUBLIC_SERVER_URL'] ? env['NEXT_PUBLIC_SERVER_URL'] : null) ||
    (env['VERCEL_URL'] ? 'https://' + env['VERCEL_URL'] : null) ||
    `http://localhost:${env['NEXT_PUBLIC_PORT'] || 3000}`
  )
}

if (require.main === module) {
  console.log(JSON.stringify(getOpenAPISpec(), null, 2))
}
