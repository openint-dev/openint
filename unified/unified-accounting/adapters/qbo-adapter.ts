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
  balanceSheet: mapper(zCast<{data: QBO['Report']}>(), unified.balanceSheet, {
    reportName: (e) => e?.data?.Header?.ReportName ?? '',
    startPeriod: (e) => e?.data?.Header?.StartPeriod ?? '',
    endPeriod: (e) => e?.data?.Header?.EndPeriod ?? '',
    currency: (e) => e?.data?.Header?.Currency ?? 'USD',
    accountingStandard: (e) =>
      e?.data?.Header?.Option?.find((opt) => opt.Name === 'AccountingStandard')
        ?.Value ?? '',
    totalCurrentAssets: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[0]?.Rows?.Row[0]?.Summary?.ColData[1]?.value || '0',
      ),
    totalFixedAssets: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[0]?.Rows?.Row[1]?.Summary?.ColData[1]?.value || '0',
      ),
    totalAssets: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[0]?.Summary?.ColData[1]?.value || '0',
      ),
    totalCurrentLiabilities: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[1]?.Rows?.Row[0]?.Summary?.ColData[1]?.value || '0',
      ),
    totalLongTermLiabilities: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[1]?.Rows?.Row[1]?.Summary?.ColData[1]?.value || '0',
      ),
    totalLiabilities: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[1]?.Summary?.ColData[1]?.value || '0',
      ),
    openingBalanceEquity: (e) =>
      Number.parseFloat(
        // @ts-expect-error fix the `Row: Record<string, never>[]` typing inside opensdks
        e?.data?.Rows?.Row[1]?.Rows?.Row[1]?.Rows?.Row[0]?.ColData[1]?.value ||
          '0',
      ),
    netIncome: (e) =>
      Number.parseFloat(
        // @ts-expect-error fix the `Row: Record<string, never>[]` typing inside opensdks
        e?.data?.Rows?.Row[1]?.Rows?.Row[1]?.Rows?.Row[2]?.ColData[1]?.value ||
          '0',
      ),
    totalEquity: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[1]?.Rows?.Row[1]?.Summary?.ColData[1]?.value || '0',
      ),
    totalLiabilitiesAndEquity: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[1]?.Summary?.ColData[1]?.value || '0',
      ),
  }),

  profitAndLoss: mapper(zCast<{data: QBO['Report']}>(), unified.profitAndLoss, {
    reportName: (e) => e?.data?.Header?.ReportName ?? '',
    startPeriod: (e) => e?.data?.Header?.StartPeriod ?? '',
    endPeriod: (e) => e?.data?.Header?.EndPeriod ?? '',
    currency: (e) => e?.data?.Header?.Currency ?? 'USD',
    accountingStandard: (e) =>
      e?.data?.Header?.Option?.find(
        (opt: any) => opt.Name === 'AccountingStandard',
      )?.Value ?? '',
    totalIncome: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[0]?.Summary?.ColData[1]?.value || '0',
      ),
    grossProfit: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[1]?.Summary?.ColData[1]?.value || '0',
      ),
    totalExpenses: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[2]?.Summary?.ColData[1]?.value || '0',
      ),
    netOperatingIncome: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[3]?.Summary?.ColData[1]?.value || '0',
      ),
    netIncome: (e) =>
      Number.parseFloat(
        e?.data?.Rows?.Row[4]?.Summary?.ColData[1]?.value || '0',
      ),
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
  getBalanceSheet: async ({instance}) => {
    const res = await instance.GET('/reports/BalanceSheet')
    return mappers.balanceSheet(res)
  },
  getProfitAndLoss: async ({instance}) => {
    const res = await instance.GET('/reports/ProfitAndLoss')
    return mappers.profitAndLoss(res)
  },
} satisfies AccountingAdapter<QBOSDK>
