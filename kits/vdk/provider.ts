import type {Link as FetchLink} from '@opensdks/fetch-links'
import {initNangoSDK} from '@opensdks/sdk-nango'
import {
  TRPCError,
  type AnyProcedure,
  type AnyRouter,
  type inferProcedureInput,
  type inferProcedureOutput,
  type MaybePromise,
} from '@trpc/server'
import {BadRequestError, remoteProcedure} from '@openint/trpc'
import {
  nangoConnectionWithCredentials,
  nangoProxyLink,
  toNangoConnectionId,
  toNangoProviderConfigKey,
} from './nangoProxyLink'

export function verticalProcedure(adapterMap: AdapterMap) {
  return remoteProcedure.use(async ({next, ctx}) => {
    const {connectorName} = ctx.remote
    const provider = adapterMap[connectorName]
    if (!provider) {
      throw new BadRequestError(`Provider ${connectorName} not found`)
    }
    return next({ctx: {...ctx, provider}})
  })
}

export type VerticalProcedureContext = ReturnType<
  ReturnType<typeof verticalProcedure>['query']
>['_def']['_ctx_out']

export interface _Provider<TInitOpts, TInstance = unknown> {
  __init__: (opts: TInitOpts) => TInstance
}

export interface AdapterMap {
  [k: string]: Adapter
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
export type Adapter = Record<string, (...args: any[]) => any> &
  _Provider<{ctx: VerticalProcedureContext} & ExtraInitOpts>

export type AdapterFromRouter<
  TRouter extends AnyRouter,
  TInstance = {},
  TCtx = VerticalProcedureContext,
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

export async function proxyCallAdapter({
  input,
  ctx,
}: {
  input: unknown
  ctx: VerticalProcedureContext
}) {
  // This should probably be in mgmt package rather than vdk with some dependency injection involved
  const extraInitOpts = ((): ExtraInitOpts => {
    const connectionId = toNangoConnectionId(ctx.remote.id) // ctx.customerId
    const providerConfigKey = toNangoProviderConfigKey(
      ctx.remote.connectorConfigId, // ctx.providerName
    )
    return {
      getCredentials: async () => {
        const nango = initNangoSDK({
          headers: {
            authorization: `Bearer ${
              ctx.env.NANGO_SECRET_KEY
              // ctx.required['x-nango-secret-key']
            }`,
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
          secretKey: ctx.env.NANGO_SECRET_KEY,
          connectionId,
          providerConfigKey,
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
      message: `${ctx.remote.connectorName} provider does not implement ${ctx.path}`,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const out = await implementation({instance, input, ctx})
  // console.log('[proxyCallRemote] output', out)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return out
}
