import {type FinchSDK, type FinchSDKTypes} from '@openint/connector-finch'
import {mapper, z, zCast} from '@openint/vdk'
import type {HrisAdapter} from '../router'
import * as unified from '../unifiedModels'

type Finch = FinchSDKTypes['oas']['components']['schemas']

const mappers = {
  individual: mapper(zCast<Finch['Individual']>(), unified.individual, {
    id: (r) => r.id ?? '',
    raw_data: (r) => r,
  }),
}

/** TODO: extend zod just like .openapi did */
function tryParse<T>(schema: z.ZodType<T>, input: unknown) {
  const res = schema.safeParse(input)
  return res.success ? res.data : null
}

export const finchAdapter = {
  listIndividual: async ({instance, input}) => {
    const paging = tryParse(
      z.object({
        count: z.number().optional(),
        offset: z.number().optional(),
      }),
      input?.cursor,
    )
    const res = await instance.GET('/employer/directory', {
      params: {query: paging ?? undefined},
    })
    const individuals = res.data.individuals?.map(mappers.individual)

    return {
      has_next_page: !!individuals?.length,
      items: individuals ?? [],
      next_cursor: JSON.stringify(res.data.paging ?? {}),
    }
  },
} satisfies HrisAdapter<FinchSDK>
