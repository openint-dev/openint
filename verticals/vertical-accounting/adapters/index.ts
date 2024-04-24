import type {ProviderMap} from '@openint/vdk'
import {qboAdapter} from './qbo-adapter'

export default {
  qbo: qboAdapter,
} satisfies ProviderMap
