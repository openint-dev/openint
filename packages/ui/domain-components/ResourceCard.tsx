import {formatDistanceToNowStrict} from 'date-fns'
import {Landmark} from 'lucide-react'
import type {ZStandard} from '@openint/cdk'
import type {RouterOutput} from '@openint/engine-backend'
import {titleCase} from '@openint/util'
import {LoadingText} from '../components/LoadingText'
import {Badge, Card} from '../shadcn'
import {cn} from '../utils'
import type {ConnectorMeta, UIProps, UIPropsNoChildren} from './ConnectorCard'
import {ConnectorLogo} from './ConnectorCard'

type Resource = RouterOutput['listConnections'][number]

export const ResourceCard = ({
  resource,
  connector,
  children,
  className,
  ...uiProps
}: UIProps & {
  resource: Resource
  connector: ConnectorMeta
}) => (
  <Card className={cn('flex items-center p-3', className)}>
    <div className="inline-flex h-12 w-12 min-w-[48px] items-center justify-center overflow-hidden rounded-xl border">
      {resource.integrationId ? (
        <IntegrationLogo
          {...uiProps}
          integration={resource.integration}
          className="h-12 w-12"
        />
      ) : (
        <ConnectorLogo
          {...uiProps}
          connector={connector}
          className="h-12 w-12"
        />
      )}
    </div>
    <div className="ml-2 mr-auto">
      <div className="flex h-6 items-center justify-between space-x-2 self-stretch">
        <h4 className="text-sm font-semibold tracking-[-0.01em] text-black antialiased">
          {resource.displayName ||
            resource.integration?.name ||
            titleCase(resource.connectorName) ||
            resource.connectorConfigId ||
            '<TODO>'}
        </h4>
        <Badge
          variant="secondary"
          className={cn(
            resource.status === 'healthy' && 'bg-green-200',
            resource.status === 'manual' && 'bg-blue-200',
            (resource.status === 'error' ||
              resource.status === 'disconnected') &&
              'bg-pink-200',
          )}>
          {/* TODO: Fix me */}
          {resource.syncInProgress ? 'Syncing' : resource.status || 'Primary'}
        </Badge>
      </div>
      <div className="text-black-mid truncate text-sm tracking-[-0.01em] antialiased">
        {resource.syncInProgress ? (
          <LoadingText text="Syncing" />
        ) : resource.lastSyncCompletedAt ? (
          `Synced ${formatDistanceToNowStrict(
            new Date(resource.lastSyncCompletedAt),
            {addSuffix: true},
          )}`
        ) : (
          'No sync information'
        )}
      </div>
    </div>
    {/* connector config id / provider name */}
    {/* Integration logo with name */}
    {/* Connection status / last synced time */}
    {/* Reconnect button */}
    {/* Do we want drop down menu? */}
    {/* Renaming (display name) */}
    {/* Deleting */}
    {children}
  </Card>
)

export function IntegrationLogo({
  integration,
  className,
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  Image = (props) => <img {...props} />,
}: UIPropsNoChildren & {
  integration?: ZStandard['integration'] | null | undefined
}) {
  return integration?.logoUrl ? (
    <Image
      src={integration.logoUrl}
      alt={`"${integration.name}" logo`}
      className={cn(
        'h-12 w-12 shrink-0 overflow-hidden object-contain',
        className,
      )}
    />
  ) : (
    <div
      className={cn(
        'flex h-12 shrink-0 items-center justify-center rounded-lg',
        className,
      )}>
      <Landmark />
    </div>
  )
}
