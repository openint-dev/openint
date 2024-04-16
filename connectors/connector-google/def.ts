import type {ConnectorDef, ConnectorSchemas} from '@openint/cdk'
import {connHelpers, oauthBaseSchema} from '@openint/cdk'
import {z} from '@openint/util'

export const zConfig = oauthBaseSchema.connectorConfig

const oReso = oauthBaseSchema.resourceSettings
export const zSettings = oReso.extend({
  oauth: oReso.shape.oauth,
})

export const googleSchemas = {
  name: z.literal('google'),
  connectorConfig: zConfig,
  resourceSettings: zSettings,
  connectOutput: oauthBaseSchema.connectOutput,
} satisfies ConnectorSchemas

export const googleHelpers = connHelpers(googleSchemas)

export const googleDef = {
  name: 'google',
  schemas: googleSchemas,
  metadata: {
    displayName: 'google',
    stage: 'beta',
    categories: ['file-storage'],
    logoUrl: '/_assets/logo-google.svg',
    nangoProvider: 'google',
  },
} satisfies ConnectorDef<typeof googleSchemas>

export default googleDef
