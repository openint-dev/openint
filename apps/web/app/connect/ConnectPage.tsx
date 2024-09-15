'use client'

import {clientConnectors} from '@openint/app-config/connectors/connectors.client'
import type {ConnectionPortalProps} from '@openint/engine-frontend'
import {ConnectionPortal} from '@openint/engine-frontend'

/**
 * Only reason this file exists is because we cannot pass clientConnectors directly
 * from a server component because it contains function references (i.e. useConnectHook)
 */
export default function ConnectPage(
  props: Omit<ConnectionPortalProps, 'clientConnectors'>,
) {
  return (
    <ConnectionPortal
      // How to we only import the client integrations dynamically that are set up by the org?
      clientConnectors={clientConnectors}
      {...props}
    />
  )
}
