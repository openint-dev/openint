'use client'

import type React from 'react'
import type {CategoryKey} from '@openint/cdk'
import type {RouterOutput} from '@openint/engine-backend'
import {_trpcReact} from '../providers/TRPCProvider'

type Connector = RouterOutput['listConnectorMetas'][number]

type ConnectorConfig = RouterOutput['listConnectorConfigInfos'][number] & {
  connector: Connector
}

type ConfiguredIntegration =
  RouterOutput['listConfiguredIntegrations']['items'][number] & {
    ccfg: ConnectorConfig
  }

export function WithConnectConfig({
  categoryKey,
  children,
}: {
  categoryKey?: CategoryKey
  // connectorName
  // connectorConfigId
  // integrationId
  // etc.
  children: (props: {
    ccfgs: ConnectorConfig[]
    ints: ConfiguredIntegration[]
  }) => React.ReactElement | null
}) {
  const listConnectorConfigsRes = _trpcReact.listConnectorConfigInfos.useQuery({
    // id: props.connectorConfigId,
    // connectorName: props.connectorName,
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
    return null
  }

  const ccfgs = listConnectorConfigsRes.data
    ?.filter((ccfg) => !categoryKey || ccfg.categories?.includes(categoryKey))
    .map((ccfg) => ({
      ...ccfg,
      connector: catalogRes.data[ccfg.connectorName]!,
    }))

  const ints = listIntegrationsRes.data?.items
    .filter((int) => !categoryKey || int.categories?.includes(categoryKey))
    .map((int) => ({
      ...int,
      ccfg: ccfgs.find((ccfg) => ccfg.id === int.connector_config_id)!,
    }))

  // console.log(category, {
  //   ccfgs,
  //   ints,
  //   catalogRes: catalogRes.data,
  // })

  return children({ccfgs, ints})
}
