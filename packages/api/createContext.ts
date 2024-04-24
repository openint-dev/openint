import {
  hubspotProvider,
  msDynamics365SalesProvider,
  pipedriveProvider,
  salesforceProvider,
} from '@openint/vertical-crm'
import {
  apolloProvider,
  outreachProvider,
  salesloftProvider,
} from '@openint/vertical-sales-engagement'

export const providerByName = {
  apollo: apolloProvider,
  salesloft: salesloftProvider,
  outreach: outreachProvider,
  hubspot: hubspotProvider,
  salesforce: salesforceProvider,
  pipedrive: pipedriveProvider,
  ms_dynamics_365_sales: msDynamics365SalesProvider,
}
