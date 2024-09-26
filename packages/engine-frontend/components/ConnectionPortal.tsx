'use client'

import {AlertTriangle} from 'lucide-react'
import type {Id, Vertical} from '@openint/cdk'
import type {UIPropsNoChildren} from '@openint/ui'
import {Card, ResourceCard} from '@openint/ui'
import {cn} from '@openint/ui/utils'
import {R} from '@openint/util'
import {WithConnectConfig} from '../hocs/WithConnectConfig'
import {_trpcReact} from '../providers/TRPCProvider'
import {ConnectButton} from './ConnectButton'
import {ResourceDropdownMenu} from './ResourceDropdownMenu'

type ConnectEventType = 'open' | 'close' | 'error'

export interface ConnectionPortalProps extends UIPropsNoChildren {
  onEvent?: (event: {type: ConnectEventType; ccfgId: Id['ccfg']}) => void
}

// TODO: Wrap this in memo so it does not re-render as much as possible.
// Also it would be nice if there was an easy way to automatically prefetch on the server side
// based on calls to useQuery so it doesn't need to be separately handled again on the client...
export function ConnectionPortal({onEvent, className}: ConnectionPortalProps) {
  const listConnectionsRes = _trpcReact.listConnections.useQuery({})
  return (
    <WithConnectConfig>
      {({ccfgs, verticals: categories}) => {
        if (!ccfgs.length) {
          return <div>No connectors configured</div>
        }

        const connectorConfigById = R.mapToObj(ccfgs, (i) => [i.id, i])
        const connections = (listConnectionsRes.data || [])
          .map((conn) => {
            const ccfg = connectorConfigById[conn.connectorConfigId]
            if (!ccfg) {
              console.warn('Missing connector config for connection', conn)
            }
            return ccfg ? {...conn, connectorConfig: ccfg} : null
          })
          .filter((c): c is NonNullable<typeof c> => !!c)

        const categoriesWithConnections = categories.map((category) => ({
          ...category,
          connections: connections.filter((c) =>
            category.connectorConfigs.includes(c.connectorConfig),
          ),
        }))

        return (
          <div className={cn('mb-4', className)}>
            {/* Listing by categories */}
            {categoriesWithConnections.map((category) => (
              <div key={category.key}>
                <h3 className="mb-4 ml-4 text-xl font-semibold tracking-tight">
                  {category.name}
                </h3>
                {category.connections.map((conn) => (
                  <ResourceCard
                    // {...uiProps}
                    key={conn.id}
                    resource={conn}
                    connector={conn.connectorConfig.connector}
                    className="mb-4">
                    <ResourceDropdownMenu
                      connectorConfig={conn.connectorConfig}
                      resource={conn}
                      onEvent={(e) => {
                        onEvent?.({
                          type: e.type,
                          ccfgId: conn.connectorConfig.id,
                        })
                      }}
                    />
                  </ResourceCard>
                ))}
                <NewConnectionCard
                  category={category}
                  hasExisting={category.connections.length > 0}
                />
              </div>
            ))}
          </div>
        )
      }}
    </WithConnectConfig>
  )
}

const NewConnectionCard = ({
  category,
  hasExisting,
}: {
  category: Vertical
  hasExisting: boolean
}) => (
  <Card className="border-stroke bg-background-light drop-shadow-small flex w-full flex-col items-center justify-center space-y-3 rounded-xl border p-6 text-center">
    <AlertTriangle className="text-orange-500" />
    <h3 className="text-black-dark mb-5 text-[24px] font-semibold leading-[36px] tracking-[-0.01em] antialiased">
      {hasExisting
        ? `Connect another ${category.name} integration`
        : `No ${category.name} integration connected`}
    </h3>

    <p className="text-black-mid mb-3 text-sm font-semibold tracking-[-0.01em] antialiased">
      Connect an integration here ASAP. This integration is needed to keep your{' '}
      {category.name} data accurate.
    </p>
    <ConnectButton
      // className="bg-purple-400 hover:bg-purple-500"
      className="bg-[#8192FF] hover:bg-purple-500"
      connectorConfigFilters={{verticalKey: category.key}}></ConnectButton>
  </Card>
)
