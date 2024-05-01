import {logLink} from '@opensdks/fetch-links'
import {initNangoSDK} from '@opensdks/sdk-nango'
import {compact} from 'remeda'
import type {ProtectedContext} from '@openint/trpc'
import {protectedProcedure, TRPCError} from '@openint/trpc'
import {
  nangoConnectionWithCredentials,
  nangoProxyLink,
  toNangoConnectionId,
  toNangoProviderConfigKey,
} from './nangoProxyLink'

export async function getRemoteContext(ctx: ProtectedContext) {
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

  const connectionId = toNangoConnectionId(resource.id) // ctx.customerId
  const providerConfigKey = toNangoProviderConfigKey(
    resource.connectorConfigId, // ctx.providerName
  )

  const instance: unknown = resource.connectorConfig.connector.newInstance?.({
    config: resource.connectorConfig.config,
    settings: resource.settings,
    fetchLinks: compact([
      logLink(),
      resource.connectorConfig.connector.metadata?.nangoProvider &&
        ctx.env.NANGO_SECRET_KEY &&
        nangoProxyLink({
          secretKey: ctx.env.NANGO_SECRET_KEY,
          connectionId,
          providerConfigKey,
        }),
    ]),
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
    onSettingsChange: (settings) =>
      ctx.services.metaLinks.patch('resource', resource.id, {settings}),
  })

  return {
    ...ctx,
    // TODO: Consider renaming to just resource rather than `remote`
    remote: {
      /** Aka remoteClient */
      instance,
      id: resource.id,
      // TODO: Rename endUserId to just customerId
      customerId: resource.endUserId ?? '',
      connectorConfigId: resource.connectorConfig.id,
      connector: resource.connectorConfig.connector,
      connectorName: resource.connectorName,
      connectorMetadata: resource.connectorConfig.connector.metadata,
      settings: resource.settings,
      // TODO: Need to be careful this is never returned to any end user endpoints
      // and only used for making requests with remotes
      config: resource.connectorConfig.config,
    },
  }
}

export const remoteProcedure = protectedProcedure.use(async ({next, ctx}) =>
  next({ctx: await getRemoteContext(ctx)}),
)

export type RemoteProcedureContext = ReturnType<
  (typeof remoteProcedure)['query']
>['_def']['_ctx_out']
