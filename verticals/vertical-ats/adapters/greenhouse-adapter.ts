import {type GreenhouseSDK} from '@openint/connector-greenhouse'
import type {ATSAdapter} from '../router'
import {mappers} from './mappers'

export const greenhouseAdapter = {
  listJobs: async ({instance, input}) => {
    const res = await instance.GET('/v1/jobs', {
      params: {
        query: {
          per_page: input?.page_size,
          page: Number(input?.cursor),
        },
      },
    })
    return {
      has_next_page: !!input?.cursor,
      items: res.data?.map(mappers.job) ?? [],
    }
  },
  listOffers: async ({instance, input}) => {
    const res = await instance.GET('/v1/offers', {
      params: {
        query: {
          per_page: input?.page_size,
          page: Number(input?.cursor),
        },
      },
    })
    return {
      has_next_page: !!input?.cursor,
      items: res.data?.map(mappers.offer) ?? [],
    }
  },
  listCandidates: async ({instance, input}) => {
    const res = await instance.GET('/v1/candidates', {
      params: {
        query: {
          per_page: input?.page_size,
          page: Number(input?.cursor),
        },
      },
    })
    return {
      has_next_page: !!input?.cursor,
      items: res.data?.map(mappers.candidate) ?? [],
    }
  },
  listDepartments: async ({instance, input}) => {
    const res = await instance.GET('/v1/departments', {
      params: {
        query: {
          per_page: input?.page_size,
          page: Number(input?.cursor),
        },
      },
    })
    return {
      has_next_page: !!input?.cursor,
      items: res.data?.map(mappers.department) ?? [],
    }
  },
} satisfies ATSAdapter<GreenhouseSDK>
