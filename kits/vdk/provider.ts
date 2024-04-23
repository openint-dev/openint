import type {Link as FetchLink} from '@opensdks/fetch-links'
import {initNangoSDK} from '@opensdks/sdk-nango'
import {initSupaglueSDK} from '@opensdks/sdk-supaglue'
import {
  TRPCError,
  type AnyProcedure,
  type AnyRouter,
  type inferProcedureInput,
  type inferProcedureOutput,
  type MaybePromise,
} from '@trpc/server'
import {BadRequestError, publicProcedure} from '@openint/trpc'
import {
  nangoConnectionWithCredentials,
  nangoProxyLink,
  toNangoConnectionId,
  toNangoProviderConfigKey,
} from './nangoProxyLink'
import {supaglueProxyLink} from './supaglueProxyLink'

export const remoteProcedure = publicProcedure.use(async ({next, ctx}) => {
  const {'x-customer-id': customerId, 'x-provider-name': providerName} =
    ctx.required
  const provider = ctx.providerByName[
    ctx.required['x-provider-name']
  ] as Provider
  if (!provider) {
    throw new BadRequestError(`Provider ${providerName} not found`)
  }
  return next({ctx: {...ctx, customerId, providerName, provider}})
})

export type RemoteProcedureContext = ReturnType<
  (typeof remoteProcedure)['query']
>['_def']['_ctx_out']

export interface _Provider<TInitOpts, TInstance = unknown> {
  __init__: (opts: TInitOpts) => TInstance
}

/** To be refactored out of vdk probably...  */
export interface ExtraInitOpts {
  proxyLinks: FetchLink[]
  /** Used to get the raw credentails in case proxyLink doesn't work (e.g. SOAP calls). Hard coded to rest for now... */
  getCredentials: () => Promise<{
    access_token: string
    // refresh_token: string
    // expires_at: string
    /** For salesforce */
    instance_url: string | null | undefined
  }>
}
export type Provider = Record<string, (...args: any[]) => any> &
  _Provider<{ctx: RemoteProcedureContext} & ExtraInitOpts>

export type ProviderFromRouter<
  TRouter extends AnyRouter,
  TInstance = {},
  TCtx = RemoteProcedureContext,
  TInitOpts = {ctx: TCtx} & ExtraInitOpts,
> = {
  [k in keyof TRouter as TRouter[k] extends AnyProcedure
    ? k
    : never]?: TRouter[k] extends AnyProcedure
    ? (opts: {
        ctx: TCtx
        instance: TInstance
        input: inferProcedureInput<TRouter[k]>
      }) => MaybePromise<inferProcedureOutput<TRouter[k]>>
    : never
} & _Provider<TInitOpts, TInstance>

/**
 * Workaround for situation where we do not want to set an override of the base url
 * and simply want to use the default.
 * TODO: Rethink the interface between nangoProxyLink, proxyCallProvider and the providers themselves to
 * make this relationship clearer
 */
export const PLACEHOLDER_BASE_URL = 'http://placeholder'

export async function proxyCallProvider({
  input,
  ctx,
}: {
  input: unknown
  ctx: RemoteProcedureContext
}) {
  // This should probably be in mgmt package rather than vdk with some dependency injection involved
  const extraInitOpts = ((): ExtraInitOpts => {
    if (ctx.mgmtProviderName === 'nango') {
      const connectionId = toNangoConnectionId(ctx.customerId)
      const providerConfigKey = toNangoProviderConfigKey(ctx.providerName)
      return {
        getCredentials: async () => {
          const nango = initNangoSDK({
            headers: {
              authorization: `Bearer ${ctx.required['x-nango-secret-key']}`,
            },
          })
          const conn = await nango
            .GET('/connection/{connectionId}', {
              params: {
                path: {connectionId},
                query: {provider_config_key: providerConfigKey},
              },
            })
            .then((r) => nangoConnectionWithCredentials.parse(r.data))
          return {
            access_token: conn.credentials.access_token,
            instance_url: conn.connection_config?.instance_url,
          }
        },
        proxyLinks: [
          nangoProxyLink({
            secretKey: ctx.required['x-nango-secret-key'],
            connectionId,
            providerConfigKey,
          }),
        ],
      }
    }
    return {
      getCredentials: async () => {
        const supaglue = initSupaglueSDK({
          headers: {'x-api-key': ctx.required['x-api-key']},
        })
        const [{data: connections}] = await Promise.all([
          supaglue.mgmt.GET('/customers/{customer_id}/connections', {
            params: {path: {customer_id: ctx.customerId}},
          }),
          // This is a no-op passthrough request to ensure credentials have been refreshed if needed
          supaglue.actions.POST('/passthrough', {
            params: {
              header: {
                'x-customer-id': ctx.customerId,
                'x-provider-name': ctx.providerName,
              },
            },
            body: {method: 'GET', path: '/'},
          }),
        ])
        const conn = connections.find(
          (c) => c.provider_name === ctx.providerName,
        )
        if (!conn) {
          throw new Error('Connection not found')
        }

        const res = await supaglue.private.exportConnection({
          customerId: conn.customer_id,
          connectionId: conn.id,
        })
        return {
          access_token: res.data.credentials.access_token,
          instance_url: res.data.instance_url,
        }
      },
      proxyLinks: [
        supaglueProxyLink({
          apiKey: ctx.required['x-api-key'],
          customerId: ctx.customerId,
          providerName: ctx.providerName,
        }),
      ],
    }
  })()

  const instance = ctx.provider.__init__({ctx, ...extraInitOpts})

  const methodName = ctx.path.split('.').pop() ?? ''
  const implementation = ctx.provider?.[methodName] as Function

  if (typeof implementation !== 'function') {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: `${ctx.providerName} provider does not implement ${ctx.path}`,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const out = await implementation({instance, input, ctx})
  // console.log('[proxyCallRemote] output', out)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return out
}
