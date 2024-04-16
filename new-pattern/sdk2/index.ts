import type {ByosHeaders} from '@openint/api'
import {
  initSDK,
  type ClientOptions,
  type SdkDefinition,
  type SDKTypes,
} from '@opensdks/runtime'
import oasMeta from './openapi.meta'
import type oasTypes from './openapi.types'

export type BYOSupaglueSDKTypes = SDKTypes<
  oasTypes,
  Omit<ClientOptions, 'headers'> & {
    headers: ByosHeaders & {[k: string]: string | undefined}
  }
>

export const byoSupaglueSDkDef = {
  types: {} as BYOSupaglueSDKTypes,
  oasMeta,
} satisfies SdkDefinition<BYOSupaglueSDKTypes>

export function initByosSDK(opts: BYOSupaglueSDKTypes['options']) {
  return initSDK(byoSupaglueSDkDef, opts)
}

export type BYOSupaglueSDK = ReturnType<typeof initByosSDK>
