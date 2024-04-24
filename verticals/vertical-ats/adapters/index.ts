import type {AdapterMap} from '@openint/vdk'
import {greenhouseAdapter} from './greenhouse-adapter'

export default {
  greenhouse: greenhouseAdapter,
} satisfies AdapterMap
