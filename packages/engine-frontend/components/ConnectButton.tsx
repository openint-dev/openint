'use client'

import React from 'react'
import type {Category} from '@openint/cdk'
import {CATEGORY_BY_KEY} from '@openint/cdk'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@openint/ui'
import type {
  ConnectorConfig,
  ConnectorConfigFilters,
} from '../hocs/WithConnectConfig'
import {WithConnectConfig} from '../hocs/WithConnectConfig'
import {WithConnectorConnect} from '../hocs/WithConnectorConnect'
import {IntegrationSearch} from './IntegrationSearch'

interface ConnectButtonCommonProps {
  className?: string
  children?: React.ReactNode
}

// TODO: Refactor WithOpenConnect out of ConnectButton
// such that users can render their own trigger fully
export function ConnectButton({
  connectorConfigFilters,
  ...commonProps
}: {
  connectorConfigFilters: ConnectorConfigFilters
} & ConnectButtonCommonProps) {
  const {categoryKey} = connectorConfigFilters
  return (
    <WithConnectConfig {...connectorConfigFilters}>
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
      <DialogContent className="flex max-h-screen flex-col sm:max-w-2xl">
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
        <IntegrationSearch connectorConfigs={connectorConfigs} />

        <DialogFooter className="shrink-0">{/* Cancel here */}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
