import type {RouterContext} from '@openint/vdk2'
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

const providerByName = {
  apollo: apolloProvider,
  salesloft: salesloftProvider,
  outreach: outreachProvider,
  hubspot: hubspotProvider,
  salesforce: salesforceProvider,
  pipedrive: pipedriveProvider,
  ms_dynamics_365_sales: msDynamics365SalesProvider,
}

export function createContext(
  opts: Omit<RouterContext, 'providerByName'>,
): RouterContext {
  return {...opts, providerByName}
}
