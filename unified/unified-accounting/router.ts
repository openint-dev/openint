import type {AdapterFromRouter, RouterMeta} from '@openint/vdk'
import {
  proxyCallAdapter,
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
  return {openapi: {...meta, path: `/unified/accounting${meta.path}`}}
}

const procedure = verticalProcedure(adapters)

export const accountingRouter = trpc.router({
  // MARK: - Account
  listAccounts: procedure
    .meta(oapi({method: 'GET', path: '/account'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.account)}))
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
  listExpenses: procedure
    .meta(oapi({method: 'GET', path: '/expense'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.expense)}))
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
  listVendors: procedure
    .meta(oapi({method: 'GET', path: '/vendor'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.vendor)}))
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
  getBalanceSheet: procedure
    .meta(oapi({method: 'GET', path: '/balance-sheet'}))
    // TBD how we want this API?
    .input(zPaginationParams.nullish())
    .output(unified.balanceSheet)
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
  getProfitAndLoss: procedure
    .meta(oapi({method: 'GET', path: '/profit-and-loss'}))
    // TBD how we want this API?
    .input(zPaginationParams.nullish())
    .output(unified.profitAndLoss)
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
})

export type AccountingAdapter<TInstance> = AdapterFromRouter<
  typeof accountingRouter,
  TInstance
>
