import React from 'react'
import type {ConnectorClient} from '@openint/cdk'

type OpenIntContext = {
  clientConnectors: Record<string, ConnectorClient>
}

const OpenIntContext = React.createContext<OpenIntContext | null>(null)

export const OpenIntConnectProvider = ({
  children,
  ...ctx
}: OpenIntContext & {children: React.ReactNode}) => (
  <OpenIntContext.Provider value={ctx}>{children}</OpenIntContext.Provider>
)

export const useOpenIntConnectContext = () => {
  const ctx = React.useContext(OpenIntContext)
  if (!ctx) {
    throw new Error('useClientConnectors must be used within a OpenIntProvider')
  }

  return ctx
}
