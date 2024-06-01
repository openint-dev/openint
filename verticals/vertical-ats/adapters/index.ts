import type {AdapterMap} from '@openint/vdk'
import {greenhouseAdapter} from './greenhouse'
import {leverAdapter} from './lever'

export default {
  lever: leverAdapter,
  greenhouse: greenhouseAdapter,
} satisfies AdapterMap
