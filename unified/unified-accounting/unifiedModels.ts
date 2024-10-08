import {z} from '@openint/vdk'

export const account = z.object({
  id: z.string(),
  number: z.string().nullish(),
  name: z.string(),
  type: z.string(), //  z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
})
// .openapi({format: 'prefix:acct'}),
export const expense = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  payment_account: z.string(),
})
// .openapi({format: 'prefix:exp'}),
export const vendor = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
})
// .openapi({format: 'prefix:ven'}),

// TODO: expand
export const balanceSheet = z.object({
  startPeriod: z.string().openapi({format: 'date'}),
  endPeriod: z.string().openapi({format: 'date'}),
  currency: z.string(),
  accountingStandard: z.string(),
  totalCurrentAssets: z.number().nullable(),
  totalFixedAssets: z.number().nullable(),
  totalAssets: z.number().nullable(),
  totalCurrentLiabilities: z.number().nullable(),
  totalLongTermLiabilities: z.number().nullable(),
  totalLiabilities: z.number().nullable(),
  openingBalanceEquity: z.number().nullable(),
  netIncome: z.number().nullable(),
  totalEquity: z.number().nullable(),
  totalLiabilitiesAndEquity: z.number().nullable(),
})

// TODO: expand
export const profitAndLoss = z.object({
  reportName: z.string(),
  startPeriod: z.string().openapi({format: 'date'}),
  endPeriod: z.string().openapi({format: 'date'}),
  currency: z.string(),
  accountingStandard: z.string(),
  totalIncome: z.number().nullable(),
  grossProfit: z.number().nullable(),
  totalExpenses: z.number().nullable(),
  netOperatingIncome: z.number().nullable(),
  netIncome: z.number().nullable(),
})
