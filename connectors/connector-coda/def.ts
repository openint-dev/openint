import codaOas from '@opensdks/sdk-coda/coda.oas.json'
import type {ConnectorDef, ConnectorSchemas, OpenApiSpec} from '@openint/cdk'
import {connHelpers} from '@openint/cdk'
import {z} from '@openint/util'

// type components = CodaSDKTypes['oas']['components']

export const codaSchemas = {
  name: z.literal('coda'),
  resourceSettings: z.object({apiKey: z.string()}),
} satisfies ConnectorSchemas

export const codaDef = {
  schemas: codaSchemas,
  name: 'coda',
  metadata: {
    categories: ['flat-files-and-spreadsheets'],
    logoUrl: '/_assets/logo-coda.png',
    stage: 'beta',
    openapiSpec: {proxied: codaOas as unknown as OpenApiSpec},
  },
} satisfies ConnectorDef<typeof codaSchemas>

export const helpers = connHelpers(codaSchemas)

export default codaDef
