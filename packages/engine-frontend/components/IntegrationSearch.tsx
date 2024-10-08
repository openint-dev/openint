'use client'

import {Loader, Search} from 'lucide-react'
import React from 'react'
import {Card, cn, ConnectorLogo, Input} from '@openint/ui'
import type {ConnectorConfig} from '../hocs/WithConnectConfig'
import type {ConnectEventType} from '../hocs/WithConnectorConnect'
import {WithConnectorConnect} from '../hocs/WithConnectorConnect'
import {_trpcReact} from '../providers/TRPCProvider'

export function IntegrationSearch({
  className,
  connectorConfigs,
  onEvent,
}: {
  className?: string
  /** TODO: Make this optional so it is easier to use it as a standalone component */
  connectorConfigs: ConnectorConfig[]
  onEvent?: (event: {
    integration: {
      connectorConfigId: string
      id: string
    }
    type: ConnectEventType
  }) => void
}) {
  const [searchText, setSearchText] = React.useState('')

  const listIntegrationsRes = _trpcReact.listConfiguredIntegrations.useQuery({
    connector_config_ids: connectorConfigs.map((ccfg) => ccfg.id),
    search_text: searchText,
  })
  const ints = listIntegrationsRes.data?.items.map((int) => ({
    ...int,
    ccfg: connectorConfigs.find((ccfg) => ccfg.id === int.connector_config_id)!,
  }))

  return (
    <div className={className}>
      {/* Search integrations */}
      <div className="mb-2 bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <form>
          <div className="relative">
            {/* top-2.5 is not working for some reason due to tailwind setup */}
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search"
              className="pl-8"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </form>
      </div>
      {/* Search results */}
      <div className="grid grid-cols-1 justify-items-center gap-4 sm:grid-cols-2 md:grid-cols-3">
        {listIntegrationsRes.isLoading ? (
          <Loader className="m-4 size-5 animate-spin text-[#8A5DF6]" />
        ) : (
          ints?.map((int) => (
            <WithConnectorConnect
              key={int.id}
              connectorConfig={{
                id: int.connector_config_id,
                connector: int.ccfg.connector,
              }}
              onEvent={(e) => {
                onEvent?.({
                  type: e.type,
                  integration: {
                    connectorConfigId: int.connector_config_id,
                    id: int.id,
                  },
                })
              }}>
              {({openConnect}) => (
                <Card
                  className={cn(
                    'flex w-[150px] cursor-pointer flex-col items-center gap-2 rounded-lg p-4',
                    'focus:outline-none focus:ring-2 focus:ring-indigo-600',
                    'transition-transform duration-200 ease-in-out hover:scale-105',
                  )}
                  onClick={() => openConnect()}>
                  <ConnectorLogo
                    connector={int.ccfg.connector}
                    className="size-[80px] rounded-lg"
                  />
                  <span className="mt-2 text-sm font-bold text-muted-foreground">
                    {int.name}
                  </span>
                </Card>
              )}
            </WithConnectorConnect>
          ))
        )}
      </div>
    </div>
  )
}
