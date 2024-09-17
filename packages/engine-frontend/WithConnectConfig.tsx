'use client'

import type React from 'react'
import type {CategoryKey} from '@openint/cdk'
import {CATEGORY_BY_KEY, type Category} from '@openint/cdk'
import type {RouterOutput} from '@openint/engine-backend'
import {_trpcReact} from './TRPCProvider'

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
  categoryKey: CategoryKey
  children: (props: {
    ccfgs: ConnectorConfig[]
    ints: ConfiguredIntegration[]
    category: Category
  }) => React.ReactElement | null
}) {
  const listConnectorConfigsRes = _trpcReact.listConnectorConfigInfos.useQuery(
    {},
  )
  const listIntegrationsRes = _trpcReact.listConfiguredIntegrations.useQuery({})

  const catalogRes = _trpcReact.listConnectorMetas.useQuery()

  if (
    !listConnectorConfigsRes.data ||
    !listIntegrationsRes.data ||
    !catalogRes.data
  ) {
    return null
  }

  const ccfgs = listConnectorConfigsRes.data
    ?.filter((ccfg) => ccfg.categories?.includes(categoryKey as never))
    .map((ccfg) => ({
      ...ccfg,
      connector: catalogRes.data[ccfg.connectorName]!,
    }))

  const ints = listIntegrationsRes.data?.items
    .filter((int) => int.categories?.includes(categoryKey as never))
    .map((int) => ({
      ...int,
      ccfg: ccfgs.find((ccfg) => ccfg.id === int.connector_config_id)!,
    }))

  const category = CATEGORY_BY_KEY[categoryKey]

  // console.log(category, {
  //   ccfgs,
  //   ints,
  //   catalogRes: catalogRes.data,
  // })

  return children({ccfgs, ints, category})
}
