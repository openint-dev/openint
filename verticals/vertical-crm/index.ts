import type {Vertical} from '@openint/vdk'
import {hubspotProvider} from './providers/hubspot-provider'
import {msDynamics365SalesProvider} from './providers/ms-dynamics-365-sales-provider'
import {pipedriveProvider} from './providers/pipedrive-provider'
import {salesforceProvider} from './providers/salesforce-provider'

export * from './providers/hubspot-provider'
export * from './providers/ms-dynamics-365-sales-provider'
export * from './providers/pipedrive-provider'
export * from './providers/salesforce-provider'
export * from './router'

export default {
  hubspot: hubspotProvider,
  salesforce: salesforceProvider,
  pipedrive: pipedriveProvider,
  ms_dynamics_365_sales: msDynamics365SalesProvider,
} satisfies Vertical
