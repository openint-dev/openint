import {initSDK} from '@opensdks/runtime'
import {
  leverSdkDef,
  type initLeverSDK,
  type LeverSDK,
  type leverTypes,
} from '@opensdks/sdk-lever'
import type {ConnectorServer} from '@openint/cdk'
import type {leverSchemas} from './def'

export type LeverSDKType = ReturnType<typeof initLeverSDK>

export type LeverTypes = leverTypes

export type LeverObjectType = LeverTypes['components']['schemas']

export const leverServer = {
  newInstance: ({config, settings}) => {
    const lever = initSDK(
      {
        ...leverSdkDef,
      },
      {
        headers: {
          authorization: `Bearer ${settings.oauth.credentials.access_token}`,
        },
        envName: config.envName,
      },
    )
    return lever
  },
} satisfies ConnectorServer<typeof leverSchemas, LeverSDK>

export default leverServer
