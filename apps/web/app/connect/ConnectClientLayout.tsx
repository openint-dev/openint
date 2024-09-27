'use client'

import {useSearchParams} from 'next/navigation'
import React from 'react'
import {clientConnectors} from '@openint/app-config/connectors/connectors.client'
import {OpenIntConnectProvider} from '@openint/engine-frontend'

// TODO: Make the list of connectors we load here should be dependent on the list of configured connectors
// to reduce bundle size
export function ConnectClientLayout(props: {children: React.ReactNode}) {
  // We need to get searchParams on the client because server side layout
  // does not have access to the searchParams due to the fact that they are not re-rendered
  // during navigation between routes sharing layout.
  // @see https://nextjs.org/docs/app/api-reference/file-conventions/layout#layouts-do-not-receive-searchparams
  const searchParams = useSearchParams()
  return (
    <OpenIntConnectProvider
      clientConnectors={clientConnectors}
      debug={!!searchParams?.get('debug')}>
      {props.children}
    </OpenIntConnectProvider>
  )
}
