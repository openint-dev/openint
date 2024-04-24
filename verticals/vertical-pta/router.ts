import type {ProviderFromRouter, RouterMeta} from '@openint/vdk'
import {
  proxyCallProvider,
  trpc,
  verticalProcedure,
  z,
  zPaginatedResult,
  zPaginationParams,
} from '@openint/vdk'
import adapters from './adapters'
import * as unified from './unifiedModels'

export {unified}

function oapi(meta: NonNullable<RouterMeta['openapi']>): RouterMeta {
  return {openapi: {...meta, path: `/verticals/pta${meta.path}`}}
}

const procedure = verticalProcedure(adapters)

export const ptaRouter = trpc.router({
  // MARK: - Account
  listAccounts: procedure
    .meta(oapi({method: 'GET', path: '/account'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.account)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  listTransactions: procedure
    .meta(oapi({method: 'GET', path: '/transaction'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.transaction)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
  listCommodities: procedure
    .meta(oapi({method: 'GET', path: '/commodity'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.commodity)}))
    .query(async ({input, ctx}) => proxyCallProvider({input, ctx})),
})

export type PtaAdapter<TInstance> = ProviderFromRouter<
  typeof ptaRouter,
  TInstance
>
