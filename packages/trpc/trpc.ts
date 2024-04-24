import type {OpenApiMeta} from '@lilyrose2798/trpc-openapi'
import {z} from '@opensdks/util-zod'
import {initTRPC, TRPCError} from '@trpc/server'
import {proxyRequired} from '@openint/env'
import type {ExtEndUserId, Viewer, ViewerRole} from '../../kits/cdk/viewer'
import type {RouterContext} from '../engine-backend/context'
import {BadRequestError} from './errors'

/** @deprecated. Dedupe me from cdk hasRole function */
function hasRole<R extends ViewerRole>(
  viewer: Viewer,
  roles: R[],
): viewer is Viewer<R> {
  return roles.includes(viewer.role as R)
}

/** Used for external systems */
export function getExtEndUserId(
  viewer: Viewer<'end_user' | 'user' | 'org' | 'system'>,
) {
  switch (viewer.role) {
    case 'end_user':
      return `eusr_${viewer.endUserId}` as ExtEndUserId
    case 'user':
      // Falling back to userId should not generally happen
      return (viewer.orgId ?? viewer.userId) as ExtEndUserId
    case 'org':
      return viewer.orgId as ExtEndUserId
    case 'system':
      return 'system' as ExtEndUserId
  }
}

export interface RouterMeta extends OpenApiMeta {
  /** @deprecated */
  response?: {
    vertical: 'accounting' | 'investment'
    entity:
      | 'account'
      | 'expense'
      | 'vendor'
      | 'security'
      | 'holding'
      | 'transaction'
    type: 'list' // | 'get'
  }
}

// Technically trpc doesn't quite belong in here... However it adds complexity to do dependency injection
// into each vertical so we are keeping it super simple for now...
export const trpc = initTRPC
  .context<RouterContext>()
  .meta<RouterMeta>()
  .create({
    allowOutsideOfServer: true,
    errorFormatter(opts) {
      const {shape, error} = opts
      if (!(error.cause?.name === 'HTTPError')) {
        return shape
      }
      const cause = error.cause as unknown as {response: {data: unknown} | null}

      // We cannot use the errorFormatter to modify here because trpc-openapi does not respect data.httpStatus field
      // so we need to catch it further upstream. But we can add some fields... Maybe we need an explicit className field?
      return {
        // This doesn't seem to work so well in prod as name can be mangled...
        class: error.constructor.name,
        ...shape,
        data: cause.response
          ? {
              ...cause.response,
              // Renaming body to be nicer. otherwise we end up with data.data
              data: undefined,
              body: cause.response.data,
            }
          : shape.data,
      }
    },
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
})
export type ByosHeaders = z.infer<typeof zByosHeaders>

// All the headers we accept here...
export const publicProcedure = trpc.procedure.use(async ({next, ctx, path}) => {
  const optional = zByosHeaders.parse(
    Object.fromEntries(ctx.headers?.entries() ?? []),
  )
  const required = proxyRequired(optional, {
    formatError: (key) => new BadRequestError(`${key} header is required`),
  })

  return next({
    ctx: {...ctx, path, optional, required},
  })
})

export const protectedProcedure = publicProcedure.use(({next, ctx}) => {
  console.log('DEBUG', ctx.viewer)
  if (!hasRole(ctx.viewer, ['end_user', 'user', 'org', 'system'])) {
    throw new TRPCError({
      code: ctx.viewer.role === 'anon' ? 'UNAUTHORIZED' : 'FORBIDDEN',
    })
  }
  const asOrgIfNeeded =
    ctx.viewer.role === 'end_user'
      ? ctx.as('org', {orgId: ctx.viewer.orgId})
      : ctx.services
  const extEndUserId = getExtEndUserId(ctx.viewer)
  return next({ctx: {...ctx, viewer: ctx.viewer, asOrgIfNeeded, extEndUserId}})
})

export const adminProcedure = publicProcedure.use(({next, ctx}) => {
  if (!hasRole(ctx.viewer, ['user', 'org', 'system'])) {
    throw new TRPCError({
      code: ctx.viewer.role === 'anon' ? 'UNAUTHORIZED' : 'FORBIDDEN',
    })
  }
  return next({ctx: {...ctx, viewer: ctx.viewer}})
})

export const systemProcedure = publicProcedure.use(({next, ctx}) => {
  if (!hasRole(ctx.viewer, ['system'])) {
    throw new TRPCError({
      code: ctx.viewer.role === 'anon' ? 'UNAUTHORIZED' : 'FORBIDDEN',
    })
  }
  return next({ctx: {...ctx, viewer: ctx.viewer}})
})

export const remoteProcedure = protectedProcedure.use(
  async ({next, ctx, path}) => {
    // TODO Should parse headers in here?
    if (!ctx.remoteResourceId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'x-resource-id header is required',
      })
    }

    // Ensure that end user can access its own resources
    if (ctx.viewer.role === 'end_user') {
      await ctx.services.getResourceOrFail(ctx.remoteResourceId)
    }

    // Elevant role to organization here
    const resource = await ctx.asOrgIfNeeded.getResourceExpandedOrFail(
      ctx.remoteResourceId,
    )

    return next({
      ctx: {
        ...ctx,
        path: path ?? ((ctx as any).path as string),
        // TODO: Consider renaming to just resource rather than `remote`
        remote: {
          id: resource.id,
          // TODO: Rename endUserId to just customerId
          customerId: resource.endUserId ?? '',
          connectorConfigId: resource.connectorConfig.id,
          connector: resource.connectorConfig.connector,
          connectorName: resource.connectorName,
          settings: resource.settings,
          // TODO: Need to be careful this is never returned to any end user endpoints
          // and only used for making requests with remotes
          config: resource.connectorConfig.config,
          fetchLinks: ctx.services.getFetchLinks(resource),
        },
      },
    })
  },
)
export type RemoteProcedureContext = ReturnType<
  (typeof remoteProcedure)['query']
>['_def']['_ctx_out']
