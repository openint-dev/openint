'use client'

import React from 'react'
import type {Vertical} from '@openint/cdk'
import {VERTICAL_BY_KEY} from '@openint/cdk'
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
import {IntegrationSearch} from './IntegrationSearch'

interface ConnectButtonCommonProps {
  className?: string
  children?: React.ReactNode
  listenForOpen?: boolean
}

// TODO: Refactor WithOpenConnect out of ConnectButton
// such that users can render their own trigger fully
export function ConnectButton({
  connectorConfigFilters,
  ...commonProps
}: {
  connectorConfigFilters: ConnectorConfigFilters
} & ConnectButtonCommonProps) {
  const {verticalKey: categoryKey} = connectorConfigFilters
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
        // Render dialog for MultiConnector scenarios
        // This would be the case for greenhouse + lever
        const category = categoryKey ? VERTICAL_BY_KEY[categoryKey] : undefined
        return (
          <MultipleConnectButton
            {...commonProps}
            connectorConfigs={rest.length === 0 ? [first] : ccfgs}
            category={category}
          />
        )
      }}
    </WithConnectConfig>
  )
}

export function MultipleConnectButton({
  listenForOpen,
  children,
  className,
  connectorConfigs,
  category,
}: {
  connectorConfigs: ConnectorConfig[]
  /** Should correspond to connectorConfigs, but we can't guarantee that statically here... */
  category?: Vertical
} & ConnectButtonCommonProps) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {

    // This can be called by the parent window like  
    // const iframe = document.getElementById('openint-connect-iframeId');
    // iframe?.contentWindow.postMessage({type: 'triggerConnectDialog', value: true },'*');

    if (listenForOpen) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'triggerConnectDialog') {
          setOpen(event.data.value);
        }
      };

      window.addEventListener('message', handleMessage);

      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [listenForOpen]);
  // Unconditional render to avoid delay when dialog is opened
  const content = (
    <IntegrationSearch
      connectorConfigs={connectorConfigs}
      onEvent={(e) => {
        if (e.type === 'close' || e.type === 'error') {
          // Cannot close during open event otherwise whole thing becomes unmounted
          // and we end up closing the connect dialog itself...
          // Once we have a global UserInputDialog
          setOpen(false)
        }
      }}
    />
  )

  return (
    // non modal dialog do not add pointer events none to the body
    // which workaround issue with multiple portals (dropdown, dialog) conflicting
    // as well as other modals introduced by things like Plaid
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogTrigger asChild>
        {!listenForOpen && (
          <Button className={className} variant="default">
            {children ?? 'Connect'}
          </Button>
        )}
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
        {content}

        <DialogFooter className="shrink-0">{/* Cancel here */}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
