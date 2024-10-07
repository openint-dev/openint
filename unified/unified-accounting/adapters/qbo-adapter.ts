import {type QBOSDK, type QBOSDKTypes} from '@openint/connector-qbo'
import {mapper, zCast} from '@openint/vdk'
import type {AccountingAdapter} from '../router'
import * as unified from '../unifiedModels'

type QBO = QBOSDKTypes['oas']['components']['schemas']

const mappers = {
  account: mapper(zCast<QBO['Account']>(), unified.account, {
    id: 'Id',
    name: 'Name',
    type: 'Classification',
    // number: 'AccountType'
  }),
  expense: mapper(zCast<QBO['Purchase']>(), unified.expense, {
    id: 'Id',
    amount: 'TotalAmt',
    currency: 'CurrencyRef.value',
    payment_account: 'AccountRef.value',
  }),
  vendor: mapper(zCast<QBO['Vendor']>(), unified.vendor, {
    id: 'Id',
    name: 'DisplayName',
    url: 'domain',
  }),
  balanceSheet: mapper(zCast<QBO['BalanceSheet']>(), unified.balanceSheet, {
    currency: 'Header.Currency',
    startPeriod: 'Header.StartPeriod',
    endPeriod: 'Header.EndPeriod',
  }),
  profitAndLoss: mapper(zCast<QBO['ProfitAndLoss']>(), unified.profitAndLoss, {
    currency: 'Header.Currency',
    startPeriod: 'Header.StartPeriod',
    endPeriod: 'Header.EndPeriod',
  }),
}

export const qboAdapter = {
  listAccounts: async ({instance}) => {
    const res = await instance.getAll('Account').next()
    return {
      has_next_page: true,
      items: res.value?.entities?.map(mappers.account) ?? [],
    }
  },
  listExpenses: async ({instance}) => {
    const res = await instance.getAll('Purchase').next()
    return {
      has_next_page: true,
      items: res.value?.entities?.map(mappers.expense) ?? [],
    }
  },
  listVendors: async ({instance}) => {
    const res = await instance.getAll('Vendor').next()
    return {
      has_next_page: true,
      items: res.value?.entities?.map(mappers.vendor) ?? [],
    }
  },
} satisfies AccountingAdapter<QBOSDK>
