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
  return {openapi: {...meta, path: `/verticals/banking${meta.path}`}}
}

const procedure = verticalProcedure(adapters)

export const bankingRouter = trpc.router({
  // MARK: - Account
  listCategories: procedure
    .meta(oapi({method: 'GET', path: '/category'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.category)}))
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
})

export type BankingAdapter<TInstance> = AdapterFromRouter<
  typeof bankingRouter,
  TInstance
>
