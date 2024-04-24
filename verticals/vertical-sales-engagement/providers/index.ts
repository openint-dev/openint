import type {ProviderMap} from '@openint/vdk'
import {apolloProvider} from './apollo-provider'
import {outreachProvider} from './outreach-provider'
import {salesloftProvider} from './salesloft-provider'

export default {
  apollo: apolloProvider,
  salesloft: salesloftProvider,
  outreach: outreachProvider,
} satisfies ProviderMap
