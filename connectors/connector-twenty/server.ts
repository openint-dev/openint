import type {RevertSDKTypes} from '@opensdks/sdk-revert'
import {initTwentySDK} from '@opensdks/sdk-twenty'
import type {ConnectorServer} from '@openint/cdk'
import {handlersLink} from '@openint/cdk'
import type {twentySchemas} from './def'

type Revert = RevertSDKTypes['oas']['components']['schemas']

export const twentyServer = {
  destinationSync: ({settings}) => {
    const twenty = initTwentySDK({
      headers: {authorization: `Bearer ${settings.access_token}`},
    })

    return handlersLink({
      data: async (op) => {
        // crm account
        // eslint-disable-next-line unicorn/prefer-switch
        if (op.data.entityName === 'company') {
          const {company} = op.data.entity as {
            [op.data.entityName]: Array<Revert['commonCompany']>
          }
          if (company) {
            await twenty.core.POST('/batch/companies', {
              body: company.map((com) => ({
                name: com.name ?? '',
                // annualRecurringRevenue: {
                //   amountMicros: String(company.annualRevenue),
                // },
                address: [
                  com.address.street,
                  com.address.city,
                  com.address.state,
                  com.address.country,
                  com.address.zip,
                  com.address.postalCode,
                ].join(', '),
                // createdAt: String(company.createdTimestamp), // TODO(@jatin): make this typesafe
                // updatedAt: String(company.updatedTimestamp),
                // ...(company.additional as Object), // TODO(@jatin): make this work
              })),
            })
          }
        } else if (op.data.entityName === 'contact') {
          const {contact} = op.data.entity as {
            [op.data.entityName]: Array<Revert['commonContact']>
          }
          if (contact) {
            await twenty.core.POST('/batch/people', {
              body: contact.map((con) => ({
                name: {
                  firstName: con.firstName,
                  lastName: con.lastName,
                },
                email: con.email,
                phone: con.phone ?? '',
              })),
              // createdAt: String(con.createdTimestamp), // TODO(@jatin): make this typesafe
              // updatedAt: String(con.updatedTimestamp),
              // ...(con.additional as Object), // TODO(@jatin): make this work
            })
          }
        } else if (op.data.entityName === 'deal') {
          const {deal} = op.data.entity as {
            [op.data.entityName]: Array<Revert['commonDeal']>
          }
          if (deal) {
            await twenty.core.POST('/batch/opportunities', {
              body: deal.map((d) => ({
                name: d.name ?? '',
                // amount: {
                //   amountMicros: String(d.amount),
                // },
                // stage: d.stage,
                // probability: String(d.probability),
                // closeDate: String(d.expectedCloseDate),
                // createdAt: String(d.createdTimestamp),
                // updatedAt: String(d.updatedTimestamp),
                // ...(d.additional as Object), // TODO(@jatin): make this work
              })),
            })
          }
        }
        return op
      },
    })
  },
} satisfies ConnectorServer<typeof twentySchemas>

export default twentyServer
