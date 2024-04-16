import type {OpenApiMeta} from '@lilyrose2798/trpc-openapi'
import {z} from '@opensdks/util-zod'
import {initTRPC} from '@trpc/server'
import {env, MGMT_PROVIDER_NAME, proxyRequired} from '@openint/env'
import {BadRequestError} from './errors'
import type {Provider} from './provider'

export interface RouterContext {
  headers: Headers
  providerByName: Record<string, Provider>
}

export interface RouterMeta extends OpenApiMeta {}

// Technically trpc doesn't quite belong in here... However it adds complexity to do dependency injection
// into each vertical so we are keeping it super simple for now...
export const trpc = initTRPC
  .context<RouterContext>()
  .meta<RouterMeta>()
  .create({
    allowOutsideOfServer: true,
    // We cannot use the errorFormatter to modify here because trpc-openapi does not respect data.httpStatus field
    // so we need to catch it further upstream. But we can add some fields... Maybe we need an explicit className field?
    errorFormatter: ({shape, error}) => ({
      // This doesn't seem to work so well in prod as name can be mangled...
      class: error.constructor.name,
      ...shape,
    }),
    // if (error instanceof NoLongerAuthenticatedError) {
    //   return {code: ''}
    // }
    // // TODO: We need better logic around this... 500 from BYOS is very different from
    // // 500 from our platform. This is likely not a good heuristic at the moement...
    // if (err instanceof HTTPError && err.code >= 500) {
    //   return 'REMOTE_ERROR'
    // }
    // // Anything else non-null would be considered internal error.
    // if (err != null) {
    //   return 'INTERNAL_ERROR'
    // }
    // console.log('errorFormatter', opts)
    // shape.data.httpStatus = 401

    //   return {
    //     ...shape,
    //     code: -32600,
    //     data: {
    //       ...shape.data,
    //       code: 'BAD_REQUEST',
    //       httpStatus: 409,
    //     },
    //   }
    // },
  })

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

export const remoteProcedure = publicProcedure.use(async ({next, ctx}) => {
  const {'x-customer-id': customerId, 'x-provider-name': providerName} =
    ctx.required
  const provider = ctx.providerByName[ctx.required['x-provider-name']]
  if (!provider) {
    throw new BadRequestError(`Provider ${providerName} not found`)
  }
  return next({ctx: {...ctx, customerId, providerName, provider}})
})

export type RemoteProcedureContext = ReturnType<
  (typeof remoteProcedure)['query']
>['_def']['_ctx_out']
