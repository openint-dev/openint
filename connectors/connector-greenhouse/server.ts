import type {ConnectorServer} from '@openint/cdk'
import type {greenhouseSchema} from './def'

export const greenhouseServer = {} satisfies ConnectorServer<
  typeof greenhouseSchema
>

export default greenhouseServer
