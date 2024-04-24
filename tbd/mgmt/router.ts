import {and, db, eq, schema} from '@openint/db'
import type {Adapter, AdapterFromRouter} from '@openint/vdk'
import {NotImplementedError, publicProcedure, trpc, z} from '@openint/vdk'
import {nangoPostgresProvider} from './providers/nango-postgres-provider'
import {supaglueProvider} from './providers/supaglue-provider'
import * as unified from './unifiedModels'

export {unified}

const mgmtProviderName = 'nango'

export const mgmtProcedure = publicProcedure.use(async ({next, ctx}) => {
  const provider: Adapter =
    mgmtProviderName === 'nango' ? nangoPostgresProvider : supaglueProvider
  return next({ctx: {...ctx, provider}})
})

type MgmtProcedureContext = ReturnType<
  (typeof mgmtProcedure)['query']
>['_def']['_ctx_out']

// type InitOpts = {ctx: MgmtProcedureContext}

export type MgmtProvider<TInstance> = AdapterFromRouter<
  typeof mgmtRouter,
  TInstance
>

// Should the mgmt router be refactored into its own package outside of API?
export const mgmtRouter = trpc.router({
  // Customer management
  listCustomers: mgmtProcedure
    .meta({openapi: {method: 'GET', path: '/customers'}})
    .input(z.void())
    .output(z.array(unified.customer))
    .query(({ctx, input}) => mgmtProxyCallProvider({ctx, input})),

  getCustomer: mgmtProcedure
    .meta({openapi: {method: 'GET', path: '/customers/{id}'}})
    .input(z.object({id: z.string()}))
    .output(unified.customer)
    .query(({ctx, input}) => mgmtProxyCallProvider({ctx, input})),
  upsertCustomer: mgmtProcedure
    .meta({openapi: {method: 'PUT', path: '/customers/{customer_id}'}})
    .input(unified.customer.pick({customer_id: true, name: true, email: true}))
    .output(unified.customer)
    .mutation(({ctx, input}) => mgmtProxyCallProvider({ctx, input})),

  // Connection management

  listConnections: mgmtProcedure
    .meta({
      openapi: {method: 'GET', path: '/customers/{customer_id}/connections'},
    })
    .input(z.object({customer_id: z.string()}))
    .output(z.array(unified.connection))
    .query(({ctx, input}) => mgmtProxyCallProvider({ctx, input})),

  getConnection: mgmtProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/customers/{customer_id}/connections/{provider_name}',
      },
    })
    .input(z.object({customer_id: z.string(), provider_name: z.string()}))
    .output(unified.connection)
    .query(({ctx, input}) => mgmtProxyCallProvider({ctx, input})),
  deleteConnection: mgmtProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/customers/{customer_id}/connections/{provider_name}',
      },
    })
    .input(z.object({customer_id: z.string(), provider_name: z.string()}))
    .output(z.void())
    .query(async ({ctx, input}) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const ret = await mgmtProxyCallProvider({ctx, input})
      // Remove sync state once connection is deleted. This is because
      // we are not using unique connection id but instead using customer_id and
      // provider_name combo to identify a connection.
      await db
        .delete(schema.sync_state)
        .where(
          and(
            eq(schema.sync_state.customer_id, input.customer_id),
            eq(schema.sync_state.provider_name, input.provider_name),
          ),
        )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return ret
    }),

  // MARK: - Sync config management

  listSyncConfigs: mgmtProcedure
    .meta({openapi: {method: 'GET', path: '/sync_configs'}})
    .input(z.void())
    .output(z.array(unified.sync_config))
    .query(({ctx, input}) => mgmtProxyCallProvider({ctx, input})),

  getConnectionSyncConfig: mgmtProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/connection_sync_configs',
      },
    })
    .input(z.void())
    .output(unified.connection_sync_config)
    .query(({ctx, input}) => mgmtProxyCallProvider({ctx, input})),

  upsertConnectionSyncConfig: mgmtProcedure
    .meta({
      openapi: {
        method: 'PUT',
        path: '/connection_sync_configs',
      },
    })
    .input(unified.connection_sync_config)
    .output(unified.connection_sync_config)
    .query(({ctx, input}) => mgmtProxyCallProvider({ctx, input})),
})

async function mgmtProxyCallProvider({
  input,
  ctx,
}: {
  input: unknown
  ctx: MgmtProcedureContext
}) {
  const instance = (ctx.provider as any).__init__({ctx})
  // verticals.salesEngagement.listContacts -> listContacts
  const methodName = ctx.path.split('.').pop() ?? ''
  const implementation = ctx.provider?.[methodName as '__init__'] as Function

  if (typeof implementation !== 'function') {
    throw new NotImplementedError(
      `${mgmtProviderName} provider does not implement ${ctx.path}`,
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const out = await implementation({instance, input, ctx})
  // console.log('[proxyCallRemote] output', out)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return out
}
