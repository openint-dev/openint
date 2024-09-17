'use client'

import NangoFrontend from '@nangohq/frontend'
import {AlertTriangle} from 'lucide-react'
import React from 'react'
import type {
  Category,
  ConnectorClient,
  Id,
  OpenDialogFn,
  UseConnectHook,
} from '@openint/cdk'
import {
  CATEGORY_BY_KEY,
  extractConnectorName,
  oauthConnect,
  zConnectorVertical,
} from '@openint/cdk'
import type {RouterOutput} from '@openint/engine-backend'
import type {UIPropsNoChildren} from '@openint/ui'
import {Card, ResourceCard} from '@openint/ui'
import {cn} from '@openint/ui/utils'
import {R} from '@openint/util'
import {CategoryConnectButton} from './ConnectButton'
import {_trpcReact} from './TRPCProvider'
import {ResourceDropdownMenu} from './WithProviderConnect'

type ConnectEventType = 'open' | 'close' | 'error'

export interface ConnectionPortalProps extends UIPropsNoChildren {
  clientConnectors: Record<string, ConnectorClient>
  onEvent?: (event: {type: ConnectEventType; ccfgId: Id['ccfg']}) => void
  /** Only connect to this connector config */
  connectorConfigId?: Id['ccfg'] | null
  connectorName?: string | null
}

type UseConnectScope = Parameters<UseConnectHook>[0]
interface DialogConfig {
  Component: Parameters<UseConnectScope['openDialog']>[0]
  options: Parameters<UseConnectScope['openDialog']>[1]
}

// TODO: Wrap this in memo so it does not re-render as much as possible.
// Also it would be nice if there was an easy way to automatically prefetch on the server side
// based on calls to useQuery so it doesn't need to be separately handled again on the client...
export function ConnectionPortal(props: ConnectionPortalProps) {
  const listConnectorConfigsRes = _trpcReact.listConnectorConfigInfos.useQuery({
    id: props.connectorConfigId,
    connectorName: props.connectorName,
  })
  const listIntegrationsRes = _trpcReact.listConfiguredIntegrations.useQuery({
    // id: props.connectorConfigId,
    // connectorName: props.connectorName,
  })
  const catalogRes = _trpcReact.listConnectorMetas.useQuery()

  if (
    !listConnectorConfigsRes.data ||
    !listIntegrationsRes.data ||
    !catalogRes.data
  ) {
    return <div>Loading...</div>
  }
  return (
    <_ConnectionPortal
      connectorConfigInfos={listConnectorConfigsRes.data ?? []}
      catalog={catalogRes.data}
      integrations={listIntegrationsRes.data.items}
      {...props}
    />
  )
}

type ConnectorConfigInfos = RouterOutput['listConnectorConfigInfos']
type Catalog = RouterOutput['listConnectorMetas']
type Integrations = RouterOutput['listConfiguredIntegrations']['items']

// TODOD: Dedupe this with app-config/constants
const __DEBUG__ = Boolean(
  typeof window !== 'undefined' && window.location.hostname === 'localhost',
)

/** Need _OpenIntConnect connectorConfigIds to not have useConnectHook execute unreliably  */
export function _ConnectionPortal({
  catalog,
  clientConnectors,
  onEvent,
  className,
  connectorConfigInfos,
  integrations,
  debugConnectorConfigs,
  ...uiProps
}: ConnectionPortalProps & {
  connectorConfigInfos: ConnectorConfigInfos
  catalog: Catalog
  integrations: Integrations
  debugConnectorConfigs?: boolean
}) {
  const nangoPublicKey =
    _trpcReact.getPublicEnv.useQuery().data?.NEXT_PUBLIC_NANGO_PUBLIC_KEY
  const nangoFrontend = React.useMemo(
    () =>
      nangoPublicKey &&
      new NangoFrontend({publicKey: nangoPublicKey, debug: __DEBUG__}),
    [nangoPublicKey],
  )

  // OpenIntConnect should be fetching its own connectorConfigIds as well as resources
  // this way it can esure those are refreshed as operations take place
  // This is esp true when we are operating in client envs (js embed)
  // and cannot run on server-side per-se

  const listConnectionsRes = _trpcReact.listConnections.useQuery({})

  console.log('[OpenIntConnect] integrations', integrations)
  const connectorConfigs = connectorConfigInfos
    .map(({id, ...info}) => {
      const connector = catalog[extractConnectorName(id)]
      if (!connector) {
        console.warn('Missing connector for connector config', id)
      }
      return connector ? {...info, id, connector} : null
    })
    .filter((i): i is NonNullable<typeof i> => !!i)
  const connectorConfigById = R.mapToObj(connectorConfigs, (i) => [i.id, i])

  // TODO: seems that we are still displaying some data from cache, fix me here...
  // Also maybe connect should be deployed to a different domain to prevent unexpected state persistence
  // that can cause sublte bugs
  const connections = (listConnectionsRes.data || [])
    .map((conn) => {
      const ccfg = connectorConfigById[conn.connectorConfigId]
      if (!ccfg) {
        console.warn('Missing connector config for connection', conn)
      }
      return ccfg ? {...conn, connectorConfig: ccfg} : null
    })
    .filter((c): c is NonNullable<typeof c> => !!c)

  console.log('[OpenIntConnect] connector configs', connectorConfigs)
  console.log('[OpenIntConnect] connections', connections)

  const [_dialogConfig, setDialogConfig] = React.useState<DialogConfig | null>(
    null,
  )
  // TODO: Fix me by actually implementing it...
  const openDialog: OpenDialogFn = React.useCallback(
    (render, options) => {
      setDialogConfig({Component: render, options})
    },
    [setDialogConfig],
  )

  // Do we actually need this here or can this go inside a ConnectCard somehow?
  const connectFnMap = R.pipe(
    connectorConfigInfos,
    R.map((ccfgInfo) => extractConnectorName(ccfgInfo.id)),
    R.uniq,
    R.mapToObj((connectorName: string) => {
      let fn = clientConnectors[connectorName]?.useConnectHook?.({openDialog})
      const nangoProvider = catalog[connectorName]?.nangoProvider
      if (!fn && nangoProvider) {
        console.log('adding nnango provider for', nangoProvider)
        fn = (_, {connectorConfigId}) => {
          if (!nangoFrontend) {
            throw new Error('Missing nango public key')
          }
          return oauthConnect({connectorConfigId, nangoFrontend, connectorName})
        }
      }
      return [connectorName, fn]
    }),
  )

  const categories = zConnectorVertical.options
    .map((categoryKey) => {
      const category = CATEGORY_BY_KEY[categoryKey]
      const ccfgs = connectorConfigs.filter(
        (ccfg) => ccfg.connector?.categories.includes(categoryKey),
      )
      return {
        ...category,
        connectorConfigs: ccfgs,
        connections: connections.filter((c) =>
          ccfgs.includes(c.connectorConfig),
        ),
      }
    })
    .filter((item) => item.connectorConfigs.length > 0)

  if (!connectorConfigs.length) {
    return <div>No connectors configured</div>
  }
  return (
    <div className={cn('mb-4', className)}>
      {/* Listing by categories */}
      {categories.map((category) => (
        <div key={category.key}>
          <h3 className="mb-4 ml-4 text-xl font-semibold tracking-tight">
            {category.name}
          </h3>
          {category.connections.map((conn) => (
            <ResourceCard
              {...uiProps}
              key={conn.id}
              resource={conn}
              connector={conn.connectorConfig.connector}
              className="mb-4">
              <ResourceDropdownMenu
                connectorConfig={conn.connectorConfig}
                resource={conn}
                connectFn={connectFnMap[conn.connectorConfig.connector.name]}
                onEvent={(e) => {
                  onEvent?.({type: e.type, ccfgId: conn.connectorConfig.id})
                }}
              />
            </ResourceCard>
          ))}
          <ConnectCard
            category={category}
            hasExisting={category.connections.length > 0}
          />
        </div>
      ))}
    </div>
  )
}

export const ConnectCard = ({
  category,
  hasExisting,
}: {
  category: Category
  hasExisting: boolean
}) => (
  <Card className="border-stroke bg-background-light drop-shadow-small flex w-full flex-col items-center justify-center space-y-3 rounded-xl border p-6 text-center">
    <AlertTriangle
      className="text-orange-500"
      style={{color: '#f97316'}} // Tailwind is not fully working for some reason...
    />
    <h3 className="text-black-dark mb-5 text-[24px] font-semibold leading-[36px] tracking-[-0.01em] antialiased">
      {hasExisting
        ? `Connect another ${category.name} integration`
        : `No ${category.name} integration connected`}
    </h3>

    <p className="text-black-mid mb-3 text-sm font-semibold tracking-[-0.01em] antialiased">
      Connect an integration here ASAP. This integration is needed to keep your{' '}
      {category.name} data accurate.
    </p>
    {/* <ConnectButton
    // For some reason not working. Maybe need to setup tailwind again?
    // className="bg-purple-400"
    >{`Connect ${category.name}`}</ConnectButton> */}
    <CategoryConnectButton categoryKey={category.key}></CategoryConnectButton>
  </Card>
)
