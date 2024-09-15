'use client'

import React from 'react'
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
import {_trpcReact} from './TRPCProvider'

export function CategoryConnectButton({category}: {category: string}) {
  const listConnectorConfigsRes = _trpcReact.listConnectorConfigInfos.useQuery(
    {},
  )
  const listIntegrationsRes = _trpcReact.listConfiguredIntegrations.useQuery({})

  const ccfgs = listConnectorConfigsRes.data?.filter(
    (ccfg) => ccfg.categories?.includes(category as never),
  )

  const ints = listIntegrationsRes.data?.items.filter(
    (int) => int.categories?.includes(category as never),
  )

  console.log(category, {
    ccfgs,
    ints,
  })

  if (!ccfgs || !ints) {
    return null
  }

  if (ccfgs.length === 0) {
    return (
      <div>
        No connectors configured for {category}. Please check your settings
      </div>
    )
  }

  if (ccfgs.length === 1) {
    // Return ConnectorConnectButton
    return null
  }

  // Render dialog for MultiConnector scenarios
  // This would be the case for greenhouse + lever

  return null
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
        <DialogFooter className="shrink-0">{/* Cancel here */}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
