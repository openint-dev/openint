'use client'

import {Search} from 'lucide-react'
import React from 'react'
import type {Category} from '@openint/cdk'
import {CATEGORY_BY_KEY, type CategoryKey} from '@openint/cdk'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  IntegrationCard,
} from '@openint/ui'
import type {ConnectorConfig} from '../hocs/WithConnectConfig'
import {WithConnectConfig} from '../hocs/WithConnectConfig'
import {WithConnectorConnect} from '../hocs/WithConnectorConnect'
import {_trpcReact} from '../providers/TRPCProvider'

interface ConnectButtonCommonProps {
  className?: string
  children?: React.ReactNode
}

export function ConnectButton({
  categoryKey,
  ...commonProps
}: {categoryKey: CategoryKey} & ConnectButtonCommonProps) {
  return (
    <WithConnectConfig categoryKey={categoryKey}>
      {({ccfgs}) => {
        const [first, ...rest] = ccfgs
        if (!first) {
          return (
            <div>
              No connectors configured for {categoryKey}. Please check your
              settings
            </div>
          )
        }
        if (rest.length === 0) {
          // e.g. Plaid
          return (
            <SingleConnectButton {...commonProps} connectorConfig={first} />
          )
        }
        // Render dialog for MultiConnector scenarios
        // This would be the case for greenhouse + lever
        const category = categoryKey ? CATEGORY_BY_KEY[categoryKey] : undefined
        return (
          <MultipleConnectButton
            {...commonProps}
            connectorConfigs={ccfgs}
            category={category}
          />
        )
      }}
    </WithConnectConfig>
  )
}

function SingleConnectButton({
  connectorConfig,
  children,
  className,
}: {
  connectorConfig: ConnectorConfig
} & ConnectButtonCommonProps) {
  return (
    <WithConnectorConnect
      connectorConfig={connectorConfig}
      // onEvent={(e) => {
      //   onEvent?.({type: e.type, ccfgId: int.connector_config_id})
      // }}
    >
      {({openConnect}) => (
        // <DialogTrigger asChild>
        <Button
          onClick={() => openConnect()}
          className={className}
          variant="default">
          {children ?? 'Connect'}
        </Button>
        // </DialogTrigger>
      )}
    </WithConnectorConnect>
  )
}

function MultipleConnectButton({
  children,
  className,
  connectorConfigs,
  category,
}: {
  connectorConfigs: ConnectorConfig[]
  /** Should correspond to connectorConfigs, but we can't guarantee that statically here... */
  category?: Category
} & ConnectButtonCommonProps) {
  const [open, setOpen] = React.useState(false)
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
    // non modal dialog do not add pointer events none to the body
    // which workaround issue with multiple portals (dropdown, dialog) conflicting
    // as well as other modals introduced by things like Plaid
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        <Button className={className} variant="default">
          {children ?? 'Connect'}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-screen flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>New connection</DialogTitle>
          <DialogDescription>
            Choose a connector config to start
          </DialogDescription>
        </DialogHeader>
        {category && (
          <>
            <h1>Select your first {category.name} integration</h1>
            <p>{category.description}</p>
          </>
        )}
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

        <DialogFooter className="shrink-0">{/* Cancel here */}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
