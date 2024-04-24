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
  return {openapi: {...meta, path: `/verticals/ats${meta.path}`}}
}

const procedure = verticalProcedure(adapters)

export const atsRouter = trpc.router({
  listJobs: procedure
    .meta(oapi({method: 'GET', path: '/jobs'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.job)}))
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
  listOffers: procedure
    .meta(oapi({method: 'GET', path: '/offers'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.offer)}))
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
  listCandidates: procedure
    .meta(oapi({method: 'GET', path: '/candidates'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.candidate)}))
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
  listDepartments: procedure
    .meta(oapi({method: 'GET', path: '/departments'}))
    .input(zPaginationParams.nullish())
    .output(zPaginatedResult.extend({items: z.array(unified.department)}))
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
})

export type ATSAdapter<TInstance> = AdapterFromRouter<
  typeof atsRouter,
  TInstance
>
