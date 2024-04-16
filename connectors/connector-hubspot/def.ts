import type {ConnectorDef, ConnectorSchemas} from '@openint/cdk'
import {connHelpers, oauthBaseSchema} from '@openint/cdk'
import {z} from '@openint/util'

export const zConfig = oauthBaseSchema.connectorConfig

const oReso = oauthBaseSchema.resourceSettings
export const zSettings = oReso.extend({
  oauth: oReso.shape.oauth,
})

export const hubspotSchemas = {
  name: z.literal('hubspot'),
  connectorConfig: zConfig,
  resourceSettings: zSettings,
  connectOutput: oauthBaseSchema.connectOutput,
} satisfies ConnectorSchemas

export const hubspotHelpers = connHelpers(hubspotSchemas)

export const hubspotDef = {
  name: 'hubspot',
  schemas: hubspotSchemas,
  metadata: {
    displayName: 'hubspot',
    stage: 'beta',
    categories: ['crm'],
    logoUrl: '/_assets/logo-hubspot.svg',
    nangoProvider: 'hubspot',
  },
} satisfies ConnectorDef<typeof hubspotSchemas>

export default hubspotDef
