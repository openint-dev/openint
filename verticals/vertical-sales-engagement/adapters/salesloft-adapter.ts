import type {
  SalesloftSDK,
  SalesloftSDKTypes,
} from '@openint/connector-salesloft'
import {mapper, zCast} from '@openint/vdk'
import type {VerticalSalesEngagement} from '../sales-engagement'
import {zSalesEngagement} from '../sales-engagement'

type Salesloft = SalesloftSDKTypes['oas']['components']['schemas']

const mappers = {
  contact: mapper(zCast<Salesloft['Person']>(), zSalesEngagement.contact, {
    // TODO: Mapper should be able to enforce types as well so number does not automatically become string.
    id: (p) => p.id?.toString() ?? '',
    first_name: (p) => p.first_name ?? '',
    last_name: (p) => p.last_name ?? '',
  }),
}

export const salesloftAdapter = {
  listContacts: async ({instance}) => {
    const res = await instance.GET('/v2/people.json', {})
    return {hasNextPage: true, items: res.data.data.map(mappers.contact)}
  },
} satisfies VerticalSalesEngagement<{instance: SalesloftSDK}>
