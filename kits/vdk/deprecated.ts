/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type {
  AnyProcedure,
  AnyRouter,
  inferProcedureInput,
  inferProcedureOutput,
  MaybePromise,
} from '@trpc/server'
import {TRPCError} from '@trpc/server'
// FIXME: This is explicitly bypassing the package system because we have a circular
// dependency here which is not great but ....
import type {
  remoteProcedure,
  RemoteProcedureContext,
  trpc,
} from '../../packages/engine-backend/router/_base'

export type RouterMap<TRouter extends AnyRouter, TOpts = {}> = {
  [k in keyof TRouter as TRouter[k] extends AnyProcedure
    ? k
    : never]?: TRouter[k] extends AnyProcedure
    ? (
        opts: {input: inferProcedureInput<TRouter[k]>} & TOpts,
      ) => MaybePromise<inferProcedureOutput<TRouter[k]>>
    : never
}

export interface VerticalRouterOpts {
  trpc: typeof trpc
  remoteProcedure: typeof remoteProcedure
  adapterByName: Record<string, any>
}

export async function proxyCallRemote({
  input,
  ctx,
  opts,
}: {
  input: unknown
  ctx: RemoteProcedureContext
  opts: VerticalRouterOpts
}) {
  const instance = ctx.remote.connector.newInstance?.({
    config: ctx.remote.config,
    settings: ctx.remote.settings,
    fetchLinks: ctx.remote.fetchLinks,
    onSettingsChange: (settings) =>
      ctx.services.metaLinks.patch('resource', ctx.remote.id, {settings}),
  })
  // verticals.salesEngagement.listContacts -> listContacts
  const adapter = opts.adapterByName[ctx.remote.connectorName]
  const methodName = ctx.path.split('.').pop() ?? ''
  const implementation = adapter?.[methodName] as Function

  if (typeof implementation !== 'function') {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: `${ctx.remote.connectorName} adapter does not implement ${ctx.path}`,
    })
  }

  const out = await implementation({instance, input})
  // console.log('[proxyCallRemote] output', out)
  return out
}
