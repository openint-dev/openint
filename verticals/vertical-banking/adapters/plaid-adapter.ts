import type {PlaidSDKTypes} from '@openint/connector-plaid'
import {mapper, zCast} from '@openint/vdk'
import * as unified from '../unifiedModels'

type Plaid = PlaidSDKTypes['oas']['components']

export const mappers = {
  transaction: mapper(
    zCast<Plaid['schemas']['Transaction']>(),
    unified.transaction,
    {
      id: 'transaction_id',
      amount: 'amount',
      currency: 'iso_currency_code',
      date: 'date',
      account_id: 'account_id',
      category_name: (p) =>
        [
          p.personal_finance_category?.primary,
          p.personal_finance_category?.detailed,
        ]
          .filter((c) => !!c)
          .join('/'),
      description: 'original_description',
      merchant_id: 'merchant_entity_id',
      merchant_name: 'merchant_name',
    },
  ),
  account: mapper(zCast<Plaid['schemas']['AccountBase']>(), unified.account, {
    id: 'account_id',
    name: 'name',
    current_balance: (a) => a.balances.current ?? undefined,
    currency: (a) => a.balances.iso_currency_code ?? undefined,
  }),
}
