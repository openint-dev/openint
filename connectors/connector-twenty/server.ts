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
          const company = op.data.entity as Revert['commonCompany']
          if (company) {
            await twenty.core.POST('/companies', {
              body: {
                id: company.id,
                name: company.name ?? '',
                annualRecurringRevenue: {
                  amountMicros: String(company.annualRevenue),
                },
                address: [
                  company.address.street,
                  company.address.city,
                  company.address.state,
                  company.address.country,
                  company.address.zip,
                  company.address.postalCode,
                ].join(', '),
                createdAt: String(company.createdTimestamp), // TODO(@jatin): make this typesafe
                updatedAt: String(company.updatedTimestamp),
                ...(company.additional as Object),
              },
            })
          }
        } else if (op.data.entityName === 'contact') {
          const contact = op.data.entity as Revert['commonContact']
          if (contact) {
            await twenty.core.POST('/people', {
              body: {
                id: contact.id,
                name: {
                  firstName: contact.firstName,
                  lastName: contact.lastName,
                },
                email: contact.email,
                phone: contact.phone,
                createdAt: String(contact.createdTimestamp), // TODO(@jatin): make this typesafe
                updatedAt: String(contact.updatedTimestamp),
                ...(contact.additional as Object),
              },
            })
          }
        } else if (op.data.entityName === 'deal') {
          const deal = op.data.entity as Revert['commonDeal']
          if (deal) {
            await twenty.core.POST('/opportunities', {
              body: {
                id: deal.id,
                name: deal.name ?? '',
                amount: {
                  amountMicros: String(deal.amount),
                },
                stage: deal.stage,
                probability: String(deal.probability),
                closeDate: String(deal.expectedCloseDate),
                createdAt: String(deal.createdTimestamp),
                updatedAt: String(deal.updatedTimestamp),
                ...(deal.additional as Object),
              },
            })
          }
        }
        return op
      },
    })
  },
} satisfies ConnectorServer<typeof twentySchemas>

export default twentyServer
