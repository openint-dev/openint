import {type LeverSDKType} from '@openint/connector-lever'
import {applyMapper} from '@openint/vdk'
import type {ATSAdapter} from '../../router'
import {mappers} from './mappers'

export const leverAdapter = {
  listJobs: async ({instance, input}) => {
    const cursor =
      input?.cursor && Number(input?.cursor) > 0
        ? Number(input?.cursor)
        : undefined
    const res = await instance.GET('/postings', {
      params: {
        // TODO: Figure out pagination for each of them since this updated_at_start based.
        // query: {
        //   // per_page: input?.page_size,
        //   page: cursor,
        // },
      },
    })
    let nextCursor = undefined
    if (input?.page_size && res.data?.data?.length === input?.page_size) {
      nextCursor = (cursor || 0) + input.page_size
    }
    return {
      has_next_page: !!nextCursor,
      next_cursor: nextCursor ? String(nextCursor) : undefined,
      items: res.data?.data?.map((d) => applyMapper(mappers.posting, d)) ?? [],
    }
  },
  // TODO: To implement
  listOffers: async ({instance, input}) => {
    const cursor =
      input?.cursor && Number(input?.cursor) > 0
        ? Number(input?.cursor)
        : undefined
    const res = await instance.GET('/opportunities', {
      params: {
        // TODO: Figure out pagination for each of them since this updated_at_start based.
        // query: {
        //   per_page: input?.page_size,
        //   page: cursor,
        // },
      },
    })
    let nextCursor = undefined
    if (input?.page_size && res.data?.data?.length === input?.page_size) {
      nextCursor = (cursor || 0) + input.page_size
    }
    return {
      has_next_page: !!nextCursor,
      next_cursor: nextCursor ? String(nextCursor) : undefined,
      items:
        res.data?.data?.map((d) => applyMapper(mappers.opportunity, d)) ?? [],
    }
  },
  listCandidates: async ({instance, input}) => {
    const cursor =
      input?.cursor && Number(input?.cursor) > 0
        ? Number(input?.cursor)
        : undefined
    const res = await instance.GET('/contacts/{id}', {
      params: {
        path: {
          id: 'dummy', // TODO: Somehow get all contact ids here or use a different API to fetch all contacts.
        },
      },
    })
    let nextCursor = undefined
    if (input?.page_size && [res.data?.data].length === input?.page_size) {
      nextCursor = (cursor || 0) + input.page_size
    }
    return {
      has_next_page: !!nextCursor,
      next_cursor: nextCursor ? String(nextCursor) : undefined,
      items:
        [res.data?.data]?.map((d) => applyMapper(mappers.contact, d)) ?? [],
    }
  },
  listDepartments: async ({instance, input}) => {
    const cursor =
      input?.cursor && Number(input?.cursor) > 0
        ? Number(input?.cursor)
        : undefined
    const res = await instance.GET('/tags')
    let nextCursor = undefined
    if (input?.page_size && res.data?.data?.length === input?.page_size) {
      nextCursor = (cursor || 0) + input.page_size
    }
    return {
      has_next_page: !!nextCursor,
      next_cursor: nextCursor ? String(nextCursor) : undefined,
      items:
        res.data?.data?.flatMap(
          (d) => d.data?.map((d) => applyMapper(mappers.tag, d)),
        ) ?? [],
    }
  },
} satisfies ATSAdapter<LeverSDKType>
