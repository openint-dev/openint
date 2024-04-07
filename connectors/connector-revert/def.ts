import type {RevertSDKTypes} from '@opensdks/sdk-revert'
import type {ConnectorDef, ConnectorSchemas} from '@usevenice/cdk'
import {connHelpers} from '@usevenice/cdk'
import {z, zCast} from '@usevenice/util'

type components = RevertSDKTypes['oas']['components']

export const revertSchemas = {
  name: z.literal('revert'),
  resourceSettings: z.object({
    api_token: z.string().describe('x-revert-api-token header'),
    customer_id: z.string().describe('x-revert-t-id header'),
    api_version: z.string().optional().describe('x-api-version header'),
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
  },
  name: 'revert',
  schemas: revertSchemas,
} satisfies ConnectorDef<typeof revertSchemas>

export default revertDef
