'use client'

import {AlertTriangle} from 'lucide-react'
import type {Id, Vertical} from '@openint/cdk'
import type {UIPropsNoChildren} from '@openint/ui'
import {Card, ResourceCard} from '@openint/ui'
import {cn} from '@openint/ui/utils'
import {R} from '@openint/util'
import {WithConnectConfig} from '../hocs/WithConnectConfig'
import {_trpcReact} from '../providers/TRPCProvider'
import {ResourceDropdownMenu} from './ResourceDropdownMenu'
import React from 'react'
import {VERTICAL_BY_KEY} from '@openint/cdk'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@openint/ui'
import type { ConnectorConfigFilters } from '../hocs/WithConnectConfig'
import {IntegrationSearch} from './IntegrationSearch'


type ConnectEventType = 'open' | 'close' | 'error'

export interface AGConnectionPortalProps extends UIPropsNoChildren {
  onEvent?: (event: {type: ConnectEventType; ccfgId: Id['ccfg']}) => void
}

// Custom comparison function for React.memo
const areEqual = (prevProps: AGConnectionPortalProps, nextProps: AGConnectionPortalProps) => {
  console.log('areEqual', prevProps, nextProps);
  return prevProps.onEvent === nextProps.onEvent && prevProps.className === nextProps.className;
};

// Define the component as a functional component
const AGConnectionPortalComponent: React.FC<AGConnectionPortalProps> = ({
  onEvent,
  className,
}) => {
  const listConnectionsRes = _trpcReact.listConnections.useQuery({})

  const [openDialog, setOpenDialog] = React.useState(true)

  // This can be called by the same window like 
  // postMessage({ type: 'triggerConnectDialog', value: false }, '*');
  // or by the parent window like  
  // const iframe = document.getElementById('openint-connect-iframeId');
  // iframe?.contentWindow.postMessage({type: 'triggerConnectDialog', value: true },'*');

  const handleMessage = React.useCallback((event: MessageEvent) => {
    if (event.data.type === 'triggerConnectDialog') {
      console.log('triggerConnectDialog', event.data.value)
      setOpenDialog(event.data.value || true);
    }
  }, []);

  React.useEffect(() => {
    console.log('Adding message event listener');
    window.addEventListener('message', handleMessage);
    return () => {
      console.log('Removing message event listener');
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  console.log('Render AGConnectionPortal, openDialog:', openDialog);

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

        return (
          <div className={cn('mb-4', className)}>
            {/* Listing by categories */}
            {categoriesWithConnections.map((category) => (
              <div key={category.key}>
                <h3 className="mb-4 text-xl font-semibold tracking-tight">
                  {category.name}
                </h3>
                {category.connections.map((conn) => (
                  <ResourceCard
                    key={conn.id}
                    resource={conn}
                    connector={conn.connectorConfig.connector}
                    className="mb-4">
                    <ResourceDropdownMenu
                      connectorConfig={conn.connectorConfig}
                      resource={conn}
                      onEvent={(e) => {
                        onEvent?.({
                          type: e.type,
                          ccfgId: conn.connectorConfig.id,
                        })
                      }}
                    />
                  </ResourceCard>
                ))}
                <NewConnectionCard
                  category={category}
                  hasExisting={category.connections.length > 0}
                />
                {openDialog && <AgConnectDialog
                  connectorConfigFilters={{verticalKey: category.key}}
                  open={openDialog}
                  setOpen={setOpenDialog}
                />}
              </div>
            ))}
          </div>
        )
      }}
    </WithConnectConfig>
  )
};

// Export the component using React.memo
export const AGConnectionPortal = React.memo(AGConnectionPortalComponent, areEqual);

const NewConnectionCard = ({
  category,
  hasExisting,
}: {
  category: Vertical
  hasExisting: boolean
}) => (
  <Card className="drop-shadow-small flex w-full flex-col items-center justify-center space-y-3 rounded-lg border border-solid border-[#e0e0e5] bg-[#f8f8fc] p-6 text-center">
    <AlertTriangle className="size-8 text-orange-500" />
    <h3 className="text-black-dark mb-2 text-[24px] font-semibold leading-[36px] tracking-tight antialiased">
      {hasExisting
        ? `Connect another ${category.name} integration`
        : `No ${category.name} integration connected`}
    </h3>

    <p className="text-black-mid mb-4 text-sm font-semibold antialiased">
      Connect an integration here ASAP. This integration is needed to keep your{' '}
      {category.name} data accurate.
    </p>
  </Card>
)

function AgConnectDialog({
  connectorConfigFilters,
  open,
  setOpen,
}: {
  connectorConfigFilters: ConnectorConfigFilters
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  console.log('AgConnectDialog', open);
  const {verticalKey: categoryKey} = connectorConfigFilters

  return (
    <WithConnectConfig {...connectorConfigFilters}>
      {({ccfgs}) => {
        const [first, ...rest] = ccfgs
        if (!first) {
          return (
            <div>
              No connectors configured for {categoryKey}. Please check your
              settings
            </div>
          )
        }
        const category = categoryKey ? VERTICAL_BY_KEY[categoryKey] : undefined
        const content = (
          <IntegrationSearch
            connectorConfigs={rest.length === 0 ? [first] : ccfgs}
            onEvent={(e) => {
              if (e.type === 'close' || e.type === 'error') {
                setOpen(false)
              }
            }}
          />
        )

        return (
          <Dialog open={open} onOpenChange={(v) => {
            console.log('onOpenChange', v);
            setOpen(v);
          }} modal={false}>
            {/* <DialogTrigger asChild>
            </DialogTrigger> */}
            <DialogContent className="flex max-h-screen flex-col sm:max-w-2xl">
              <DialogHeader className="shrink-0">
                <DialogTitle>New connection</DialogTitle>
                <DialogDescription>
                  Choose a connector config to start
                </DialogDescription>
              </DialogHeader>
              {category && (
                <>
                  <h1>Select your first {category.name} integration</h1>
                  <p>{category.description}</p>
                </>
              )}
              {content}
              <DialogFooter className="shrink-0">{/* Cancel here */}</DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }}
    </WithConnectConfig>
  )
}