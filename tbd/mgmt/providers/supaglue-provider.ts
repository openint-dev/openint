/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type {SupaglueSDK} from '@opensdks/sdk-supaglue'
import {initSupaglueSDK} from '@opensdks/sdk-supaglue'
import type {unified, MgmtProvider} from '../router'

export const supaglueProvider = {
  __init__: ({ctx}) =>
    initSupaglueSDK({headers: {'x-api-key': ctx.required['x-api-key']}}),
  listCustomers: async ({instance}) =>
    instance.mgmt.GET('/customers').then((r) => r.data),
  getCustomer: async ({instance, input}) =>
    instance.mgmt
      .GET('/customers/{customer_id}', {
        params: {path: {customer_id: input.id}},
      })
      .then((r) => r.data),
  upsertCustomer: async ({instance, input}) =>
    instance.mgmt
      .PUT('/customers', {
        body: {
          customer_id: input.customer_id,
          email: input.email!,
          name: input.name!,
        },
      })
      .then((r) => r.data),
  listConnections: async ({instance, input}) =>
    instance.mgmt
      .GET('/customers/{customer_id}/connections', {
        params: {path: {customer_id: input.customer_id}},
      })
      .then((r) => r.data),
  getConnection: async ({instance, input}) =>
    instance.mgmt
      .GET('/customers/{customer_id}/connections/{provider_name}', {
        params: {
          path: {
            customer_id: input.customer_id,
            provider_name: input.provider_name as 'hubspot',
          },
        },
      })
      .then((r) => r.data),
  deleteConnection: async ({instance, input}) =>
    instance.mgmt
      .DELETE('/customers/{customer_id}/connections/{provider_name}', {
        params: {
          path: {
            customer_id: input.customer_id,
            provider_name: input.provider_name as 'hubspot',
          },
        },
      })
      .then((r) => r.data),

  // MARK: -

  listSyncConfigs: async ({instance}) =>
    instance.mgmt.GET('/sync_configs').then((r) =>
      r.data.map(
        (sc): unified.SyncConfig => ({
          provider_name: sc.provider_name,
          custom_objects: sc.config.custom_objects,
          unified_objects: sc.config.common_objects,
          standard_objects: sc.config.standard_objects,
        }),
      ),
    ),
  getConnectionSyncConfig: async ({instance, ctx}) =>
    instance.mgmt
      .GET('/connection_sync_configs', {
        params: {
          header: {
            'x-customer-id': ctx.required['x-customer-id'],
            'x-provider-name': ctx.required['x-provider-name'],
          },
        },
      })

      .then((r) => r.data),
  upsertConnectionSyncConfig: async ({instance, input, ctx}) =>
    instance.mgmt
      .PUT('/connection_sync_configs', {
        params: {
          header: {
            'x-customer-id': ctx.required['x-customer-id'],
            'x-provider-name': ctx.required['x-provider-name'],
          },
        },
        body: {
          custom_objects: input.custom_objects!,
          destination_config: input.destination_config as {
            type: 'postgres'
            schema: string
          },
        },
      })
      .then((r) => r.data),
  // Maybe having a way to specify required methods could be nice for providers
} satisfies MgmtProvider<SupaglueSDK>
