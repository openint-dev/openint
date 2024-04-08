import type {RevertSDKTypes} from '@opensdks/sdk-revert'
import revertOas from '@opensdks/sdk-revert/revert.oas.json'
import type {ConnectorDef, ConnectorSchemas, OpenApiSpec} from '@usevenice/cdk'
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
    tenant_id: z
      .string()
      .describe(
        "x-revert-t-id header. This is the end user, aka Revert's customer's customer",
      ),
    temp_pipe_out_streams: z
      .record(
        z.enum(['company', 'contact', 'deal']),
        z.union([
          z.object({
            fields: z.array(z.string()).describe('List of fields to retrieve'),
          }),
          z.undefined().describe('Disabled'),
        ]),
      )
      .optional()
      .describe('This will be moved to the pipeline object'),
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
    openapiSpec: {
      proxied: revertOas as OpenApiSpec,
    },
  },
  name: 'revert',
  schemas: revertSchemas,
} satisfies ConnectorDef<typeof revertSchemas>

export default revertDef
