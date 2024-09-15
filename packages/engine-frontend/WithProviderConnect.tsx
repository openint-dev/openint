'use client'

import {useMutation} from '@tanstack/react-query'
import {Link2, Loader2, RefreshCw, Trash2} from 'lucide-react'
import React from 'react'
import type {Id, UseConnectHook} from '@openint/cdk'
import {CANCELLATION_TOKEN, extractId} from '@openint/cdk'
import type {RouterInput, RouterOutput} from '@openint/engine-backend'
import type {SchemaFormElement, UIProps} from '@openint/ui'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SchemaForm,
  useToast,
} from '@openint/ui'
import {z} from '@openint/util'
import {_trpcReact} from './TRPCProvider'

type ConnectEventType = 'open' | 'close' | 'error'

type Resource = RouterOutput['listConnections'][number]

type Catalog = RouterOutput['listConnectorMetas']

type ConnectorMeta = Catalog[string]

export const ConnectorConnectButton = ({
  onEvent,
  className,
  ...props
}: UIProps & {
  connectorConfig: {id: Id['ccfg']; connector: ConnectorMeta}
  resource?: Resource
  connectFn?: ReturnType<UseConnectHook>
  onEvent?: (event: {type: ConnectEventType}) => void
}) => (
  <WithConnectorConnect {...props}>
    {({loading, label, openConnect: open, variant}) => (
      <DialogTrigger asChild>
        <Button
          className={cn('mt-2', className)}
          disabled={loading}
          variant={variant}
          onClick={(e) => {
            onEvent?.({type: 'open'})
            if (!props.connectFn) {
              // Allow the default behavior of opening the dialog
              return
            }
            // Prevent dialog from automatically opening
            // as we invoke provider client side JS
            e.preventDefault()
            open()
          }}>
          {label}
        </Button>
      </DialogTrigger>
    )}
  </WithConnectorConnect>
)

export const WithConnectorConnect = ({
  connectorConfig: ccfg,
  resource,
  connectFn,
  children,
}: {
  connectorConfig: {id: Id['ccfg']; connector: ConnectorMeta}
  resource?: Resource
  connectFn?: ReturnType<UseConnectHook>
  onEvent?: (event: {type: ConnectEventType}) => void
  children: (props: {
    openConnect: () => void
    label: string
    variant: 'default' | 'ghost'
    loading: boolean
  }) => React.ReactNode
}) => {
  // console.log('ConnectCard', int.id, int.connector)

  const resourceExternalId = resource ? extractId(resource.id)[2] : undefined

  // TODO: Handle preConnectInput schema and such... for example for Plaid
  const preConnect = _trpcReact.preConnect.useQuery(
    [ccfg.id, {resourceExternalId}, {}],
    {enabled: ccfg.connector.hasPreConnect},
  )
  const postConnect = _trpcReact.postConnect.useMutation()
  const createResource = _trpcReact.createResource.useMutation()

  const {toast} = useToast()

  const connect = useMutation(
    // not sure if it's the right idea to have create and connect together in
    // one mutation, starting to feel a bit confusing...
    async (input?: RouterInput['createResource']) => {
      // For postgres and various connectors that does not require client side JS
      if (input) {
        return createResource.mutateAsync(input)
      }
      // For plaid and other connectors that requires client side JS
      // TODO: Test this...
      // How to make sure does not actually refetch we if we already have data?
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const connInput = ccfg.connector.hasPreConnect
        ? (await preConnect.refetch()).data
        : {}
      console.log(`[OpenIntConnect] ${ccfg.id} connInput`, connInput)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const connOutput = connectFn
        ? await connectFn?.(connInput, {connectorConfigId: ccfg.id})
        : connInput
      console.log(`[OpenIntConnect] ${ccfg.id} connOutput`, connOutput)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const postConnOutput = ccfg.connector.hasPostConnect
        ? await postConnect.mutateAsync([connOutput, ccfg.id, {}])
        : connOutput
      console.log(`[OpenIntConnect] ${ccfg.id} postConnOutput`, postConnOutput)

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return postConnOutput
    },
    {
      onSuccess(msg) {
        if (msg) {
          toast({
            title: `Success (${ccfg.connector.displayName})`,
            description: `${msg}`,
            variant: 'success',
          })
        }
        setOpen(false)
      },
      onError: (err) => {
        if (err === CANCELLATION_TOKEN) {
          return
        }
        toast({
          title: `Failed to connect to ${ccfg.connector.displayName}`,
          description: `${err}`,
          variant: 'destructive',
        })
      },
    },
  )

  const [open, setOpen] = React.useState(false)
  const formRef = React.useRef<SchemaFormElement>(null)

  // console.log('ccfg', int.id, 'open', open)
  return (
    // non modal dialog do not add pointer events none to the body
    // which workaround issue with multiple portals (dropdown, dialog) conflicting
    // as well as other modals introduced by things like Plaid
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      {children({
        // Children is responsible for rendering dialog triggers as needed
        openConnect: () => {
          connect.mutate(undefined)
        },
        loading: connect.isLoading,
        variant: resource?.status === 'disconnected' ? 'default' : 'ghost',
        label: resource ? 'Reconnect' : 'Connect',
      })}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to {ccfg.connector.name}</DialogTitle>
          <DialogDescription>
            Using connector config ID: {ccfg.id}
          </DialogDescription>
        </DialogHeader>
        <SchemaForm
          ref={formRef}
          schema={z.object({})}
          jsonSchemaTransform={(schema) =>
            ccfg.connector.schemas.resourceSettings ?? schema
          }
          formData={{}}
          // formData should be non-null at this point, we should fix the typing
          loading={connect.isLoading}
          onSubmit={({formData}) => {
            console.log('resource form submitted', formData)
            connect.mutate({connectorConfigId: ccfg.id, settings: formData})
          }}
          hideSubmitButton
        />
        {/* Children here */}
        <DialogFooter>
          <Button
            disabled={connect.isLoading}
            onClick={() => formRef.current?.submit()}
            type="submit">
            {connect.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

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
    connectFn?: ReturnType<UseConnectHook>
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
