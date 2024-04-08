import type {FinchSDKTypes} from '@opensdks/sdk-finch'
import finchOas from '@opensdks/sdk-finch/finch.oas.json'
import type {ConnectorDef, ConnectorSchemas, OpenApiSpec} from '@usevenice/cdk'
import {connHelpers} from '@usevenice/cdk'
import {z, zCast} from '@usevenice/util'

type components = FinchSDKTypes['oas']['components']

export const finchSchemas = {
  name: z.literal('finch'),
  connectorConfig: z.object({
    client_id: z.string(),
    client_secret: z.string(),
    api_version: z.string().optional().describe('Finch API version'),
  }),
  resourceSettings: z.object({
    access_token: z.string(),
  }),
  sourceOutputEntities: {
    company: zCast<components['schemas']['Company']>(),
    // contact: zCast<components['schemas']['commonContact']>(),
    // deal: zCast<components['schemas']['commonDeal']>(),
  },
} satisfies ConnectorSchemas

export const helpers = connHelpers(finchSchemas)

export const finchDef = {
  metadata: {
    categories: ['payroll'],
    logoUrl: '/_assets/logo-finch.svg',
    stage: 'beta',
    // TODO: Make the openAPI spec dynamic.. It can be many megabytes per connector
    // among other things...
    openapiSpec: {
      proxied: finchOas as OpenApiSpec,
    },
  },
  name: 'finch',
  schemas: finchSchemas,
} satisfies ConnectorDef<typeof finchSchemas>

export default finchDef
