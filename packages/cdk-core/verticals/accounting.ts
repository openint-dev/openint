import type {MaybePromise} from '@usevenice/util'
import {z} from '@usevenice/util'

import type {IntegrationSchemas, IntHelpers} from '../integration.types'
import type {
  PaginatedOutput,
  Pagination,
  VerticalRouterOpts,
} from './new-mapper'
import {paginatedOutput, proxyListRemote, zPaginationParams} from './new-mapper'

export const zAccounting = {
  account: z.object({
    id: z.string(),
    number: z.string().nullish(),
    name: z.string(),
    type: z.string(), //  z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  }),
  // .openapi({format: 'prefix:acct'}),
  expense: z.object({
    id: z.string(),
    amount: z.number(),
    currency: z.string(),
    payment_account: z.string(),
  }),
  // .openapi({format: 'prefix:exp'}),
  vendor: z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
  }),
  // .openapi({format: 'prefix:ven'}),
}

export const zAccountingEntityName = z.enum(
  Object.keys(zAccounting) as [keyof typeof zAccounting],
)

export type ZAccounting = {
  [k in keyof typeof zAccounting]: z.infer<(typeof zAccounting)[k]>
}

export interface AccountingVertical<
  TDef extends IntegrationSchemas,
  TInstance,
  T extends IntHelpers<TDef> = IntHelpers<TDef>,
> {
  list?: <TType extends keyof ZAccounting>(
    instance: TInstance,
    stream: TType,
    opts: Pagination,
  ) => MaybePromise<PaginatedOutput<T['_verticals']['accounting'][TType]>>
  get?: <TType extends keyof ZAccounting>(
    instance: TInstance,
    stream: TType,
    opts: Pagination,
  ) => MaybePromise<T['_verticals']['accounting'][TType] | null>
}

// This is unfortunately quite duplicated...
// Guess it means accounting router also belongs in the engine backend...

export function createAccountingRouter(opts: VerticalRouterOpts) {
  // We cannot use a single trpc procedure because neither openAPI nor trpc
  // supports switching output shape that depends on input
  return opts.trpc.router({
    listAccounts: opts.remoteProcedure
      .meta({
        openapi: {method: 'GET', path: '/accounting/accounts'},
        response: {vertical: 'accounting', entity: 'account', type: 'list'},
      })
      .input(zPaginationParams.nullish())
      .output(paginatedOutput(zAccounting.account))
      .query(proxyListRemote),
    listExpenses: opts.remoteProcedure
      .meta({
        openapi: {method: 'GET', path: '/accounting/expenses'},
        response: {vertical: 'accounting', entity: 'expense', type: 'list'},
      })
      .input(zPaginationParams.nullish())
      .output(paginatedOutput(zAccounting.expense))
      .query(proxyListRemote),
    listVendors: opts.remoteProcedure
      .meta({
        openapi: {method: 'GET', path: '/accounting/vendors'},
        response: {vertical: 'accounting', entity: 'vendor', type: 'list'},
      })
      .input(zPaginationParams.nullish())
      .output(paginatedOutput(zAccounting.vendor))
      .query(proxyListRemote),
  })
}