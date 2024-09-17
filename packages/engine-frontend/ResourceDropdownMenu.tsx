'use client'

import {Link2, RefreshCw, Trash2} from 'lucide-react'
import React from 'react'
import type {Id} from '@openint/cdk'
import type {RouterOutput} from '@openint/engine-backend'
import type {UIProps} from '@openint/ui'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  useToast,
} from '@openint/ui'
import {_trpcReact} from './TRPCProvider'
import {WithConnectorConnect} from './WithConnectorConnect'

type ConnectEventType = 'open' | 'close' | 'error'

type Resource = RouterOutput['listConnections'][number]

type Catalog = RouterOutput['listConnectorMetas']

type ConnectorMeta = Catalog[string]

/**
 * TODO: Add loading indicator when mutations are happening as a result of
 * selecting dropdown menu action
 */
export function ResourceDropdownMenu(
  props: UIProps & {
    connectorConfig: {
      id: Id['ccfg']
      connector: ConnectorMeta
    }
    resource: Resource
    onEvent?: (event: {type: ConnectEventType}) => void
  },
) {
  const {toast} = useToast()
  const [open, setOpen] = React.useState(false)

  // Add me when we introduce displayName field
  // const updateResource = trpcReact.updateResource.useMutation({
  //   onSuccess: () => {
  //     setOpen(false)
  //     toast({title: 'Resource updated', variant: 'success'})
  //   },
  //   onError: (err) => {
  //     toast({
  //       title: 'Failed to save resource',
  //       description: `${err.message}`,
  //       variant: 'destructive',
  //     })
  //   },
  // })
  const deleteResource = _trpcReact.deleteResource.useMutation({
    onSuccess: () => {
      setOpen(false)
      toast({title: 'Resource deleted', variant: 'success'})
    },
    onError: (err) => {
      toast({
        title: 'Failed to delete resource',
        description: `${err.message}`,
        variant: 'destructive',
      })
    },
  })
  const syncResource = _trpcReact.dispatch.useMutation({
    onSuccess: () => {
      setOpen(false)
      toast({title: 'Sync requested', variant: 'success'})
    },
    onError: (err) => {
      toast({
        title: 'Failed to start sync',
        description: `${err.message}`,
        variant: 'destructive',
      })
    },
  })
  // Is there a way to build the variables into useMutation already?
  const syncResourceMutate = () =>
    syncResource.mutate({
      name: 'sync/resource-requested',
      data: {resourceId: props.resource.id},
    })

  // TODO: Implement delete
  return (
    // Not necessarily happy that we have to wrap the whole thing here inside
    // WithProviderConnect but also don't know of a better option
    <WithConnectorConnect {...props}>
      {(connectProps) => (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">Options</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>{props.resource.id}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => {
                  // Need to explicitly close dropdown menu
                  // otherwise pointer:none will remain on the body for some reason
                  // if a dialog inside opens immediately... (e.g. editing postgres)
                  setOpen(false)
                  connectProps.openConnect()
                }}>
                <Link2 className="mr-2 h-4 w-4" />
                <span>{connectProps.label}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => syncResourceMutate()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                <span>Sync</span>
              </DropdownMenuItem>
              {/* Rename */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => deleteResource.mutate({id: props.resource.id})}>
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </WithConnectorConnect>
  )
}
