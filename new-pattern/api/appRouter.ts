// not sure about directly depending on vdk from api, but anyways
import {mgmtRouter} from '@openint/mgmt'
import {trpc} from '@openint/vdk'
import {crmRouter} from '@openint/vertical-crm'
import {salesEngagementRouter} from '@openint/vertical-sales-engagement2'

export const appRouter = trpc.router({
  // public: publicRouter,
  mgmt: mgmtRouter,
  salesEngagement: salesEngagementRouter,
  crm: crmRouter,
})
