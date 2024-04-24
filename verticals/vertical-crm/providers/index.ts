import type {ProviderMap} from '@openint/vdk'
import {hubspotProvider} from './hubspot-provider'
import {msDynamics365SalesProvider} from './ms-dynamics-365-sales-provider'
import {pipedriveProvider} from './pipedrive-provider'
import {salesforceProvider} from './salesforce-provider'

export default {
  hubspot: hubspotProvider,
  salesforce: salesforceProvider,
  pipedrive: pipedriveProvider,
  ms_dynamics_365_sales: msDynamics365SalesProvider,
} satisfies ProviderMap
