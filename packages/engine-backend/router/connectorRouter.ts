import {metaForConnector, zIntegrationCategory} from '@openint/cdk'
import type {RouterMeta} from '@openint/trpc'
import {TRPCError} from '@openint/trpc'
import {R, z} from '@openint/util'
import {zBaseRecord, zPaginatedResult, zPaginationParams} from '@openint/vdk'
import {zodToOas31Schema} from '@openint/zod'
import {publicProcedure, trpc} from './_base'

const tags = ['Connectors']

function oapi(meta: NonNullable<RouterMeta['openapi']>): RouterMeta {
  return {openapi: {...meta, path: `${meta.path}`, tags}}
}

export const connectorRouter = trpc.router({
  listConnectorMetas: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/connector',
        tags,
        description: 'Get catalog of all available connectors',
      },
    })
    .input(z.object({includeOas: z.boolean().optional()}).optional())
    // TODO: Add deterministic type for the output here
    .output(z.unknown())
    .query(({ctx, input}) =>
      R.mapValues(ctx.connectorMap, (connector) =>
        metaForConnector(connector, input),
      ),
    ),
  getConnectorMeta: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/connector/{name}',
        tags,
      },
    })
    .input(z.object({includeOas: z.boolean().optional(), name: z.string()}))
    // TODO: Add deterministic type for the output here
    .output(z.unknown())
    .query(({ctx, input: {name, ...input}}) => {
      const connector = ctx.connectorMap[name]
      if (!connector) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Connector ${name} not found`,
        })
      }
      return metaForConnector(connector, input)
    }),
  getConnectorOpenApiSpec: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/connector/{name}/oas',
        tags,
      },
    })
    .input(z.object({name: z.string(), original: z.boolean().optional()}))
    // TODO: Add deterministic type for the output here
    .output(z.unknown())
    .query(({ctx, input: {name, ...input}}) => {
      const connector = ctx.connectorMap[name]
      if (!connector) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Connector ${name} not found`,
        })
      }
      const specs = metaForConnector(connector, {includeOas: true}).openapiSpec
      return input.original ? specs?.original : specs?.proxied
    }),
  getConnectorSchemas: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/connector/{name}/schemas',
        tags,
      },
    })
    // TODO: Make the value of `type` an enum
    .input(z.object({name: z.string(), type: z.string().optional()}))
    .output(z.unknown())
    .query(({ctx, input: {name, type}}) => {
      const connector = ctx.connectorMap[name]
      if (!connector) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Connector ${name} not found`,
        })
      }

      if (type) {
        const zodSchema =
          connector?.schemas[type as keyof (typeof connector)['schemas']]
        return zodToOas31Schema(zodSchema as z.ZodTypeAny)
      }
      return R.mapValues(connector.schemas, (zodSchema) =>
        zodToOas31Schema(zodSchema as z.ZodTypeAny),
      )
    }),
  // how do we leverage proxycall here?
  // Connectors itself is also a vertical, and
  // it'd be nice to leverage the same primitive
  listConnectorIntegrations: publicProcedure
    .meta(oapi({method: 'GET', path: '/connector/{name}/integrations'}))
    .input(zPaginationParams.extend({name: z.string()}))
    // TODO: Add deterministic type for the output here
    .output(
      zPaginatedResult.extend({
        items: z.array(
          zBaseRecord.extend({
            name: z.string(),
            logo_url: z.string().nullish(),
            login_url: z.string().nullish(),
            categories: z.array(zIntegrationCategory).nullish(),
          }),
        ),
      }),
    )
    .query(({ctx, input: {name, ...params}}) => {
      const connector = ctx.connectorMap[name]
      if (!connector) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Connector ${name} not found`,
        })
      }
      if (connector.listIntegrations) {
        return connector.listIntegrations(params).then((res) => ({
          ...res,
          items: res.items.map((item) => ({
            ...item,
            id: `${name}_${item.id}`,
          })),
        }))
      }
      const meta = metaForConnector(connector)
      return {
        has_next_page: false,
        items: [
          {
            id: name,
            name: meta.displayName,
            updated_at: new Date().toISOString(),
            logo_url: meta.logoUrl,
          },
        ],
        next_cursor: null,
      }
    }),
})
