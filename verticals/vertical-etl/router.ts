import type {AdapterFromRouter, RouterMeta} from '@openint/vdk'
import {proxyCallAdapter, trpc, verticalProcedure, z} from '@openint/vdk'
import adapters from './adapters'
import * as unified from './unifiedModels'

export {unified}

function oapi(meta: NonNullable<RouterMeta['openapi']>): RouterMeta {
  return {openapi: {...meta, path: `/verticals/etl${meta.path}`}}
}

const procedure = verticalProcedure(adapters)

export const router = trpc.router({
  discover: procedure
    .meta(oapi({method: 'GET', path: '/discover'}))
    .input(z.void())
    .output(unified.messageCatalog)
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
  read: procedure
    .meta(oapi({method: 'GET', path: '/read'}))
    .input(z.object({}))
    .output(z.array(unified.messageRecord))
    .query(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
  write: procedure
    .meta(oapi({method: 'POST', path: '/write'}))
    .input(z.array(unified.messageRecord))
    .output(z.array(unified.message))
    .mutation(async ({input, ctx}) => proxyCallAdapter({input, ctx})),
})

export type Adapter<TInstance> = AdapterFromRouter<typeof router, TInstance>
