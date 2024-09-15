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
