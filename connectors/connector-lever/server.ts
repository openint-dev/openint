import {type LeverSDK} from '@opensdks/sdk-lever'
import type {ConnectorServer} from '@openint/cdk'
import type {leverSchemas} from './def'

export const leverServer = {} satisfies ConnectorServer<
  typeof leverSchemas,
  LeverSDK
>

export default leverServer
