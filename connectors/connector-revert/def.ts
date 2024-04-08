import type {RevertSDKTypes} from '@opensdks/sdk-revert'
import type {ConnectorDef, ConnectorSchemas} from '@usevenice/cdk'
import {connHelpers} from '@usevenice/cdk'
import {z, zCast} from '@usevenice/util'

type components = RevertSDKTypes['oas']['components']

export const revertSchemas = {
  name: z.literal('revert'),
  connectorConfig: z.object({
    api_token: z.string().describe('Revert API token'),
    api_version: z.string().optional().describe('Revert API version'),
  }),
  resourceSettings: z.object({
    customer_id: z.string().describe('x-revert-t-id header'),
  }),
  sourceOutputEntities: {
    company: zCast<components['schemas']['commonCompany']>(),
    contact: zCast<components['schemas']['commonContact']>(),
    deal: zCast<components['schemas']['commonDeal']>(),
  },
} satisfies ConnectorSchemas

export const helpers = connHelpers(revertSchemas)

export const revertDef = {
  metadata: {
    categories: ['crm'],
    logoUrl: '/_assets/logo-revert.png',
    stage: 'beta',
  },
  name: 'revert',
  schemas: revertSchemas,
} satisfies ConnectorDef<typeof revertSchemas>

export default revertDef
