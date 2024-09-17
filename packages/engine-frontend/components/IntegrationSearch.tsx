'use client'

import {Search} from 'lucide-react'
import React from 'react'
import {Input, IntegrationCard} from '@openint/ui'
import type {ConnectorConfig} from '../hocs/WithConnectConfig'
import {WithConnectorConnect} from '../hocs/WithConnectorConnect'
import {_trpcReact} from '../providers/TRPCProvider'

export function IntegrationSearch({
  className,
  connectorConfigs,
}: {
  className?: string
  connectorConfigs: ConnectorConfig[]
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
  // TODO: implement loading state here...
  if (!ints) {
    return null
  }

  return (
    <div className={className}>
      {/* Search integrations */}
      <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      <div className="flex flex-wrap gap-4">
        {ints.map((int) => (
          <WithConnectorConnect
            key={int.id}
            connectorConfig={{
              id: int.connector_config_id,
              connector: int.ccfg.connector,
            }}
            // TODO: pre-select a single integration when possible
            // onEvent={(e) => {
            //   onEvent?.({type: e.type, ccfgId: int.connector_config_id})
            // }}
          >
            {({openConnect}) => (
              // <DialogTrigger asChild>
              <IntegrationCard
                // {...uiProps}
                onClick={() => openConnect()}
                integration={{
                  ...int,
                  connectorName: int.connector_name,
                  // connectorConfigId: int.connector_config_id,
                }}
              />
              // </DialogTrigger>
            )}
          </WithConnectorConnect>
        ))}
      </div>
    </div>
  )
}
