import type {QBOSDK, QBOSDKTypes} from '@openint/connector-qbo'
import {mapper, z, zCast} from '@openint/vdk'
import type {VerticalBanking} from '../banking'
import {zBanking} from '../banking'

type QBO = QBOSDKTypes['oas']['components']['schemas']

const mappers = {
  category: mapper(
    zCast<QBO['Account']>(),
    zBanking.category.extend({_raw: z.unknown().optional()}),
    {
      id: 'Id',
      name: 'FullyQualifiedName',
      _raw: (a) => a,
    },
  ),
}

export const qboAdapter = {
  listCategories: async ({instance}) => {
    const res = await instance.query(
      // QBO API does not support OR in SQL query...
      "SELECT * FROM Account WHERE Classification IN ('Revenue', 'Expense') MAXRESULTS 1000",
    )
    return {
      hasNextPage: false,
      items: (res.Account ?? []).map(mappers.category),
    }
  },
} satisfies VerticalBanking<{instance: QBOSDK}>
