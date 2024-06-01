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
