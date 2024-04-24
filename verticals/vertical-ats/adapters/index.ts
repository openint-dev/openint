import type {AdapterMap} from '@openint/vdk'
import {greenhouseAdapter} from './greenhouse'

export default {
  greenhouse: greenhouseAdapter,
} satisfies AdapterMap
