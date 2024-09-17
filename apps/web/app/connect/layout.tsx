'use client'

import React from 'react'
import {clientConnectors} from '@openint/app-config/connectors/connectors.client'
import {OpenIntConnectProvider} from '@openint/engine-frontend'

// TODO: Make the list of connectors we load here should be dependent on the list of configured connectors
// to reduce bundle size
export default function ConnectLayout(props: {children: React.ReactNode}) {
  return (
    <OpenIntConnectProvider clientConnectors={clientConnectors}>
      {props.children}
    </OpenIntConnectProvider>
  )
}
