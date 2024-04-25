import type {ConnectorDef, ConnectorSchemas} from '@openint/cdk'
import {connHelpers} from '@openint/cdk'
import {z} from '@openint/util'

export const greenhouseSchema = {
  name: z.literal('greenhouse'),
  resourceSettings: z.object({apiKey: z.string()}),
} satisfies ConnectorSchemas

export const greenhouseHelpers = connHelpers(greenhouseSchema)

export const greenhouseDef = {
  name: 'greenhouse',
  schemas: greenhouseSchema,
  metadata: {
    displayName: 'greenhouse',
    stage: 'beta',
    categories: ['ats'],
    logoUrl: '/_assets/logo-greenhouse.png',
  },
} satisfies ConnectorDef<typeof greenhouseSchema>

export default greenhouseDef
