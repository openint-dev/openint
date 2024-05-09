import type {ConnectorDef, ConnectorSchemas} from '@openint/cdk'
import {connHelpers, oauthBaseSchema} from '@openint/cdk'
import {z} from '@openint/util'

export const zConfig = oauthBaseSchema.connectorConfig

const oReso = oauthBaseSchema.resourceSettings
export const zSettings = oReso.extend({
  oauth: oReso.shape.oauth,
})

export const leverSchemas = {
  name: z.literal('lever'),
  connectorConfig: zConfig,
  resourceSettings: zSettings,
  connectOutput: oauthBaseSchema.connectOutput,
} satisfies ConnectorSchemas

export const leverHelpers = connHelpers(leverSchemas)

export const leverDef = {
  name: 'lever',
  schemas: leverSchemas,
  metadata: {
    displayName: 'Lever',
    stage: 'beta',
    categories: ['ats'],
    logoUrl: '/_assets/logo-lever.svg',
  },
} satisfies ConnectorDef<typeof leverSchemas>

export default leverDef
