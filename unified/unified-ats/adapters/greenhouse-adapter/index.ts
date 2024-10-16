import {type GreenhouseSDK} from '@openint/connector-greenhouse'
import {applyMapper} from '@openint/vdk'
import type {ATSAdapter} from '../../router'
import {mappers} from './mappers'

export const greenhouseAdapter = {
  listJobs: async ({instance, input}) => {
    const cursor =
      input?.cursor && Number(input?.cursor) > 0
        ? Number(input?.cursor)
        : undefined
    const res = await instance.GET('/v1/jobs', {
      params: {
        query: {
          per_page: input?.page_size,
          page: cursor,
        },
      },
    })
    let nextCursor = undefined
    if (input?.page_size && res.data?.length === input?.page_size) {
      nextCursor = (cursor || 0) + input.page_size
    }
    return {
      has_next_page: !!nextCursor,
      next_cursor: nextCursor ? String(nextCursor) : undefined,
      items: res.data?.map((d) => applyMapper(mappers.job, d)) ?? [],
    }
  },
  listJobOpenings: async ({instance, input}) => {
    const cursor =
      input?.cursor && Number(input?.cursor) > 0
        ? Number(input?.cursor)
        : undefined
    const jobId = input?.jobId;
    if (!jobId) {
      throw new Error('jobId is required');
    }
    // @ts-expect-error while greenhouse sdk is updated
    const res = await instance.GET(`/v1/jobs/${jobId}/openings`, {
      params: {
        query: {
          per_page: input?.page_size,
          page: cursor,
        },
      },
    })
    let nextCursor = undefined
    // @ts-expect-error while greenhouse sdk is updated
    if (input?.page_size && res.data?.length === input?.page_size) {
      nextCursor = (cursor || 0) + input.page_size
    }
    return {
      has_next_page: !!nextCursor,
      next_cursor: nextCursor ? String(nextCursor) : undefined,
      // @ts-expect-error while greenhouse sdk is updated
      items: res.data?.map((d) => applyMapper(mappers.jobOpening, d)) ?? [],
    }
  },
  listOffers: async ({instance, input}) => {
    const cursor =
      input?.cursor && Number(input?.cursor) > 0
        ? Number(input?.cursor)
        : undefined
    const res = await instance.GET('/v1/offers', {
      params: {
        query: {
          per_page: input?.page_size,
          page: cursor,
        },
      },
    })
    let nextCursor = undefined
    if (input?.page_size && res.data?.length === input?.page_size) {
      nextCursor = (cursor || 0) + input.page_size
    }
    return {
      has_next_page: !!nextCursor,
      next_cursor: nextCursor ? String(nextCursor) : undefined,
      items: res.data?.map((d) => applyMapper(mappers.offer, d)) ?? [],
    }
  },
  listCandidates: async ({instance, input}) => {
    const cursor =
      input?.cursor && Number(input?.cursor) > 0
        ? Number(input?.cursor)
        : undefined
    const res = await instance.GET('/v1/candidates', {
      params: {
        query: {
          per_page: input?.page_size,
          page: cursor,
        },
      },
    })
    let nextCursor = undefined
    if (input?.page_size && res.data?.length === input?.page_size) {
      nextCursor = (cursor || 0) + input.page_size
    }
    return {
      has_next_page: !!nextCursor,
      next_cursor: nextCursor ? String(nextCursor) : undefined,
      items: res.data?.map((d) => applyMapper(mappers.candidate, d)) ?? [],
    }
  },
  listDepartments: async ({instance, input}) => {
    const cursor =
      input?.cursor && Number(input?.cursor) > 0
        ? Number(input?.cursor)
        : undefined
    const res = await instance.GET('/v1/departments', {
      params: {
        query: {
          per_page: input?.page_size,
          page: cursor,
        },
      },
    })
    let nextCursor = undefined
    if (input?.page_size && res.data?.length === input?.page_size) {
      nextCursor = (cursor || 0) + input.page_size
    }
    return {
      has_next_page: !!nextCursor,
      next_cursor: nextCursor ? String(nextCursor) : undefined,
      items: res.data?.map((d) => applyMapper(mappers.department, d)) ?? [],
    }
  },
} satisfies ATSAdapter<GreenhouseSDK>
