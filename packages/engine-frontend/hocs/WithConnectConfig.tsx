'use client'

import type React from 'react'
import type {Category} from '@openint/cdk'
import {CATEGORY_BY_KEY, type CategoryKey} from '@openint/cdk'
import type {RouterOutput} from '@openint/engine-backend'
import {_trpcReact} from '../providers/TRPCProvider'

export type Connector = RouterOutput['listConnectorMetas'][string]

export type ConnectorConfig =
  RouterOutput['listConnectorConfigInfos'][number] & {
    connector: Connector
  }

export type ConfiguredIntegration =
  RouterOutput['listConfiguredIntegrations']['items'][number] & {
    ccfg: ConnectorConfig
  }
export type ConfiguredCategory = Category & {
  connectorConfigs: ConnectorConfig[]
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
    categories: ConfiguredCategory[]
  }) => React.ReactElement | null
}) {
  const listIntegrationsRes = _trpcReact.listConfiguredIntegrations.useQuery({
    // id: props.connectorConfigId,
    // connectorName: props.connectorName,
  })

  const listConnectorConfigsRes = _trpcReact.listConnectorConfigInfos.useQuery({
    // id: props.connectorConfigId,
    // connectorName: props.connectorName,
  })

  const listConnectorsRes = _trpcReact.listConnectorMetas.useQuery()

  if (
    !listIntegrationsRes.data ||
    !listConnectorConfigsRes.data ||
    !listConnectorsRes.data
  ) {
    return null
  }

  const ccfgs = listConnectorConfigsRes.data
    ?.filter((ccfg) => !categoryKey || ccfg.categories?.includes(categoryKey))
    .map((ccfg) => ({
      ...ccfg,
      connector: listConnectorsRes.data[ccfg.connectorName]!,
    }))

  const ints = listIntegrationsRes.data?.items
    .filter((int) => !categoryKey || int.categories?.includes(categoryKey))
    .map((int) => ({
      ...int,
      ccfg: ccfgs.find((ccfg) => ccfg.id === int.connector_config_id)!,
    }))

  const categories = Object.values(CATEGORY_BY_KEY)
    .map((category) => {
      const categoryCcfgs = ccfgs.filter(
        (ccfg) => ccfg.connector?.categories.includes(category.key),
      )
      return {...category, connectorConfigs: categoryCcfgs}
    })
    .filter((item) => item.connectorConfigs.length > 0)

  // console.log(category, {
  //   ccfgs,
  //   ints,
  //   catalogRes: catalogRes.data,
  // })

  return children({ccfgs, ints, categories})
}
