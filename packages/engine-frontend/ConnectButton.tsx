'use client'

import {Search} from 'lucide-react'
import React from 'react'
import type {CategoryKey} from '@openint/cdk'
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
import {WithConnectConfig} from './WithConnectConfig'
import {WithConnectorConnect} from './WithConnectorConnect'

export function CategoryConnectButton({
  categoryKey,
}: {
  categoryKey: CategoryKey
}) {
  return (
    <WithConnectConfig categoryKey={categoryKey}>
      {({ccfgs}) => {
        if (ccfgs.length === 0) {
          return (
            <div>
              No connectors configured for {categoryKey}. Please check your
              settings
            </div>
          )
        }

        if (ccfgs.length === 1) {
          // Return ConnectorConnectButton
          return <div>Single ConnectorConnectButton</div>
        }

        // Render dialog for MultiConnector scenarios
        // This would be the case for greenhouse + lever

        return <MultipleConnectDialog categoryKey={categoryKey} />
      }}
    </WithConnectConfig>
  )
}

export function MultipleConnectDialog({
  children,
  className,
  categoryKey,
}: {
  className?: string
  children?: React.ReactNode
  categoryKey: CategoryKey
}) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState('')

  return (
    <WithConnectConfig categoryKey={categoryKey}>
      {({ints: allInts, category}) => {
        const needle = searchValue.toLowerCase().trim()
        const ints = needle
          ? allInts.filter((int) => int.name.toLowerCase().includes(needle))
          : allInts
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
              {/* <OpenIntConnect
          className="flex-1 overflow-scroll"
          {...props}
          onEvent={(event) => {
            // How do we close the dialog when an connector config has been chosen?
            // This is problematic because if OpenIntConnect itself gets removed from dom
            // then any dialog it presents goes away also
            // Tested forceMount though and it doesn't quite work... So we might want something like a hidden
            props.onEvent?.(event)
          }}
        /> */}
              {/* Children here */}
              <h1>Select your first {category.name} integration</h1>
              <p>{category.description}</p>
              {/* Search integrations */}
              <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <form>
                  <div className="relative">
                    {/* top-2.5 is not working for some reason due to tailwind setup */}
                    <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search"
                      className="pl-8"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
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

              <DialogFooter className="shrink-0">
                {/* Cancel here */}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }}
    </WithConnectConfig>
  )
}

/**
 * TODO: Figure out if we can reuse the same dialog such that when a provider is selected
 * we can replace the dialog content.
 * Alternatively if there's something like a mobile app navigation where it's part of a
 * "back" stack...
 */
export function ConnectButton({
  children,
  className,
}: {
  className?: string
  children?: React.ReactNode
}) {
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
      <DialogContent className="flex max-h-screen flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>New connection</DialogTitle>
          <DialogDescription>
            Choose a connector config to start
          </DialogDescription>
        </DialogHeader>
        {/* <OpenIntConnect
          className="flex-1 overflow-scroll"
          {...props}
          onEvent={(event) => {
            // How do we close the dialog when an connector config has been chosen?
            // This is problematic because if OpenIntConnect itself gets removed from dom
            // then any dialog it presents goes away also
            // Tested forceMount though and it doesn't quite work... So we might want something like a hidden
            props.onEvent?.(event)
          }}
        /> */}
        {/* Children here */}
        <h1>Select your first {} integration</h1>
        <p>
          Our secure API identifies employees and compensation by integrating
          with your payroll. Only users who are invited to the platform can
          access this information, and the integration is one-way with no impact
          on original data.
        </p>
        {/* Search integrations */}
        {/* Search results */}
        <DialogFooter className="shrink-0">{/* Cancel here */}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
