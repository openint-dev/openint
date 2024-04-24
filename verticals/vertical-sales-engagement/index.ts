import type {Vertical} from '@openint/vdk'
import {apolloProvider} from './providers/apollo-provider'
import {outreachProvider} from './providers/outreach-provider'
import {salesloftProvider} from './providers/salesloft-provider'

export * from './providers/apollo-provider'
export * from './providers/outreach-provider'
export * from './providers/salesloft-provider'
export * from './router'

export default {
  apollo: apolloProvider,
  salesloft: salesloftProvider,
  outreach: outreachProvider,
} satisfies Vertical
