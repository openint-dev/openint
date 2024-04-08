import type {RevertSDKTypes} from '@opensdks/sdk-revert'
import {initTwentySDK} from '@opensdks/sdk-twenty'
import type {ConnectorServer} from '@usevenice/cdk'
import {handlersLink} from '@usevenice/cdk'
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
                name: company.name ?? '',

                // TODO(@jatinsandilya): Add other fields here...
              },
            })
          }
        } else if (op.data.entityName === 'contact') {
          const contact = op.data.entity as Revert['commonContact']
          if (contact) {
            await twenty.core.POST('/people', {
              body: {
                name: {
                  firstName: contact.firstName,
                  lastName: contact.lastName,
                },
              },
            })
          }
        } else if (op.data.entityName === 'deal') {
          const deal = op.data.entity as Revert['commonDeal']
          if (deal) {
            await twenty.core.POST('/opportunities', {
              body: {
                name: deal.name ?? '',
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
