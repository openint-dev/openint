import type {OpenApiMeta} from '@lilyrose2798/trpc-openapi'
import {z} from '@opensdks/util-zod'
import {initTRPC} from '@trpc/server'
import {env, MGMT_PROVIDER_NAME, proxyRequired} from '@openint/env'
import {BadRequestError} from './errors'

export interface RouterContext {
  headers: Headers
  providerByName: Record<string, unknown>
}

export interface RouterMeta extends OpenApiMeta {}

// Technically trpc doesn't quite belong in here... However it adds complexity to do dependency injection
// into each vertical so we are keeping it super simple for now...
export const trpc = initTRPC
  .context<RouterContext>()
  .meta<RouterMeta>()
  .create({allowOutsideOfServer: true})

export const zByosHeaders = z.object({
  'x-customer-id': z.string().nullish(),
  'x-provider-name': z.string().nullish(),
  'x-nango-secret-key': z.string().nullish(),
  /** Supaglue API key */
  'x-api-key': z.string().nullish(),
  /** Will use nangoPostgres instead of supaglue */
  'x-mgmt-provider-name': MGMT_PROVIDER_NAME.optional(),
})
export type ByosHeaders = z.infer<typeof zByosHeaders>

// All the headers we accept here...
export const publicProcedure = trpc.procedure.use(async ({next, ctx, path}) => {
  const optional = zByosHeaders.parse(Object.fromEntries(ctx.headers.entries()))
  const required = proxyRequired(optional, {
    formatError: (key) => new BadRequestError(`${key} header is required`),
  })

  // Defaulting to supaglue here for now but worker defaults to nango
  const mgmtProviderName =
    optional['x-mgmt-provider-name'] ?? env.MGMT_PROVIDER_NAME

  return next({
    ctx: {...ctx, path, optional, required, mgmtProviderName},
  })
})
