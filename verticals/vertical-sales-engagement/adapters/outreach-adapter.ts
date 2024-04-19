import type {OutreachSDK, OutreachSDKTypes} from '@openint/connector-outreach'
import {mapper, zCast} from '@openint/vdk'
import type {VerticalSalesEngagement} from '../sales-engagement'
import {zSalesEngagement} from '../sales-engagement'

type Outreach = OutreachSDKTypes['oas']['components']['schemas']

const mappers = {
  contact: mapper(
    zCast<Outreach['prospectResponse']>(),
    zSalesEngagement.contact,
    {
      id: (r) => r.id?.toString() ?? '',
      first_name: (r) => r.attributes?.firstName ?? '',
      last_name: (r) => r.attributes?.lastName ?? '',
    },
  ),
}

export const outreachAdapter = {
  listContacts: async ({instance}) => {
    const res = await instance.GET('/prospects', {})
    return {hasNextPage: true, items: res.data.data?.map(mappers.contact) ?? []}
  },
} satisfies VerticalSalesEngagement<{instance: OutreachSDK}>
