'use client'

import {Loader, Settings} from 'lucide-react'
import type {Id} from '@openint/cdk'
import type {UIPropsNoChildren} from '@openint/ui'
import {
  Badge,
  ConnectorLogo,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
  useToast,
} from '@openint/ui'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@openint/ui/shadcn/Tabs'
import {cn} from '@openint/ui/utils'
import {R} from '@openint/util'
import {WithConnectConfig} from '../hocs/WithConnectConfig'
import {_trpcReact} from '../providers/TRPCProvider'
import {ConnectDialog} from './ConnectDialog'

type ConnectEventType = 'open' | 'close' | 'error'

export interface ConnectionPortalProps extends UIPropsNoChildren {
  onEvent?: (event: {type: ConnectEventType; ccfgId: Id['ccfg']}) => void
}

// TODO: Wrap this in memo so it does not re-render as much as possible.
// Also it would be nice if there was an easy way to automatically prefetch on the server side
// based on calls to useQuery so it doesn't need to be separately handled again on the client...
export function ConnectionPortal({className}: ConnectionPortalProps) {
  const {toast} = useToast()
  const ctx = _trpcReact.useContext()
  const listConnectionsRes = _trpcReact.listConnections.useQuery({})

  const deleteResource = _trpcReact.deleteResource.useMutation({
    onSuccess: () => {
      toast({title: 'Connection deleted', variant: 'success'})
    },
    onError: (err) => {
      toast({
        title: 'Failed to delete connection',
        description: `${err.message}`,
        variant: 'destructive',
      })
    },
    onSettled: () => {
      ctx.listConnections.invalidate()
    },
  })

  return (
    <WithConnectConfig>
      {({ccfgs, verticals: categories}) => {
        if (!ccfgs.length) {
          return <div>No connectors configured</div>
        }

        const connectorConfigById = R.mapToObj(ccfgs, (i) => [i.id, i])
        const connections = (listConnectionsRes.data || [])
          .map((conn) => {
            const ccfg = connectorConfigById[conn.connectorConfigId]
            if (!ccfg) {
              console.warn('Missing connector config for connection', conn)
            }
            return ccfg ? {...conn, connectorConfig: ccfg} : null
          })
          .filter((c): c is NonNullable<typeof c> => !!c)

        const categoriesWithConnections = categories.map((category) => ({
          ...category,
          connections: connections.filter((c) =>
            category.connectorConfigs.includes(c.connectorConfig),
          ),
        }))
        const connectionCount = connections.length
        console.log({connectionCount})

        return (
          <div className={cn('gap-4 p-8', className)}>
            {/* Listing by categories */}
            <Tabs defaultValue="connections" className="w-[400px]">
              <TabsList>
                <TabsTrigger value="connections">
                  My Connections ({connectionCount})
                </TabsTrigger>
                <TabsTrigger value="add-connection">
                  Add a Connection
                </TabsTrigger>
              </TabsList>
              <TabsContent value="connections">
                {connectionCount === 0 ? (
                  <div className="flex flex-col gap-2 p-4">
                    <div>
                      <p className="text-base font-semibold">
                        No connections yet
                      </p>
                      <p className="text-base">
                        Add a connection to get started
                      </p>
                    </div>
                    <ConnectDialog
                      className="self-end bg-[#8A5DF6] hover:bg-[#A082E9]"
                      connectorConfigFilters={{}}
                      onEvent={(event) => {
                        if (event.type === 'close') {
                          listConnectionsRes.refetch(); // Trigger refetch
                        }
                            }}
                    ></ConnectDialog>
                  </div>
                ) : (
                  <div className="p-4">
                    {listConnectionsRes.isLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <Loader className="size-5 animate-spin text-[#8A5DF6]" />
                      </div>
                    ) : (
                      categoriesWithConnections.map((category) => (
                        <div
                          key={category.name}
                          className="flex flex-col space-y-4">
                          {category.connections.map((conn) => (
                            <>
                              <div
                                key={conn.id}
                                className="flex flex-row justify-between gap-4">
                                <div className="flex flex-row gap-4">
                                  <ConnectorLogo
                                    connector={conn.connectorConfig.connector}
                                    className="size-[64px] rounded-lg"
                                  />
                                  <div className="flex h-full flex-col justify-center">
                                    <div className="flex flex-row items-center gap-2">
                                      <h4 className="font-bold">
                                        {conn.connectorName
                                          .charAt(0)
                                          .toUpperCase() +
                                          conn.connectorName.slice(1)}
                                      </h4>
                                      <Badge variant="secondary">
                                        {category.name}
                                      </Badge>
                                    </div>
                                    {conn.pipelineIds.length > 0 && (
                                      <div className="mt-2">
                                        {conn.syncInProgress ? (
                                          <div className="flex flex-row items-center justify-start gap-2">
                                            <Loader className="size-5 animate-spin text-[#8A5DF6]" />
                                            <p className="font-semibold">
                                              Syncing...
                                            </p>
                                          </div>
                                        ) : (
                                          <p>Successfully synced</p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger>
                                    <Settings className="size-5 text-[#808080]" />
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="flex w-[80px] items-center justify-center">
                                    <DropdownMenuItem
                                      className="flex items-center justify-center"
                                      onSelect={() =>
                                        deleteResource.mutate({id: conn.id})
                                      }>
                                      <span className="text-center font-medium text-red-500">
                                        Delete
                                      </span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              {/* TODO: Improve the condition to hide the separator for the last item, right now it iterates 
                        over all categories and all connections, would be good to have a single array of connections with the category 
                        information included already */}
                              <Separator className="w-full" />
                            </>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="add-connection">
                <div className="flex flex-col gap-2 p-4">
                  <div>
                    <p className="text-base font-semibold">
                      Setup a new Connection
                    </p>
                    <p className="text-base">
                      Choose a connector config to start
                    </p>
                  </div>
                  <ConnectDialog
                    className="self-end bg-[#8A5DF6] hover:bg-[#A082E9]"
                    connectorConfigFilters={{}}
                    onEvent={(event) => {
                      if (event.type === 'close') {
                          listConnectionsRes.refetch(); // Trigger refetch
                        }
                      }}
                ></ConnectDialog>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )
      }}
    </WithConnectConfig>
  )
}
