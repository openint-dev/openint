'use client'

import {Loader2} from 'lucide-react'
import Image from 'next/image'
import React from 'react'

import {zIntegrationStage, zIntegrationVertical, zRaw} from '@usevenice/cdk'
import type {RouterOutput} from '@usevenice/engine-backend'
import {_trpcReact} from '@usevenice/engine-frontend'
import type {SchemaFormElement} from '@usevenice/ui'
import {
  IntegrationCard as _IntegrationCard,
  ConnectorCard as _ProviderCard,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  LoadingText,
  SchemaForm,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  useToast,
} from '@usevenice/ui'
import {inPlaceSort, R, titleCase, z} from '@usevenice/util'

import {useCurrengOrg} from '@/components/viewer-context'
import {cn} from '@/lib-client/ui-utils'

type Integration = RouterOutput['adminListIntegrations'][number]

export default function IntegrationsPage() {
  const integrationsRes = _trpcReact.adminListIntegrations.useQuery()
  const catalog = _trpcReact.getIntegrationCatalog.useQuery()
  if (!integrationsRes.data || !catalog.data) {
    return <LoadingText className="block p-4" />
  }

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">
        Connector Configs
      </h2>
      {integrationsRes.isFetching && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {integrationsRes.data ? (
        <div className="flex flex-wrap">
          {integrationsRes.data.map((int) => {
            const connector = catalog.data[int.connectorName]!
            return (
              <IntegrationCard
                key={int.id}
                connector={connector}
                integration={int}>
                <IntegrationSheet
                  integration={int}
                  connectorName={connector.name}
                />
              </IntegrationCard>
            )
          })}
        </div>
      ) : (
        <div>No integrations configured</div>
      )}
      {/* Spacer */}
      <div className="mt-4" />
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">
        Connector Catalog
      </h2>
      {zIntegrationVertical.options.map((category) => {
        const stageByIndex = R.mapToObj.indexed(
          zIntegrationStage.options,
          (o, i) => [o, i],
        )
        const connectors = inPlaceSort(
          Object.values(catalog.data).filter(
            (p) => p.categories.includes(category) && p.stage !== 'hidden',
          ),
        ).desc((p) => stageByIndex[p.stage])
        if (!connectors.length) {
          return null
        }
        return (
          <div key={category}>
            <h3 className="mb-4 ml-4 text-xl font-semibold tracking-tight">
              {titleCase(category)}
            </h3>
            <div className="flex flex-wrap">
              {connectors.map((connector) => (
                <ProviderCard
                  key={`${category}-${connector.name}`}
                  connector={connector}>
                  {connector.stage === 'alpha' ? (
                    <Button
                      className="mt-2"
                      variant="ghost"
                      onClick={() =>
                        window.open(
                          `mailto:hi@venice.is?subject=Request%20access%20to%20${connector.displayName}%20integration&body=My%20use%20case%20is...`,
                        )
                      }>
                      Request access
                    </Button>
                  ) : (
                    <IntegrationSheet connectorName={connector.name} />
                  )}
                </ProviderCard>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// import {defConnectors } from '@usevenice/app-config/integrations/integrations.def'

export function IntegrationSheet({
  integration: int,
  connectorName,
}: {
  integration?: Omit<Integration, 'connectorName'>
  connectorName: string
}) {
  const catalogRes = _trpcReact.getIntegrationCatalog.useQuery()
  const connector = catalogRes.data?.[connectorName]

  // Consider calling this provider, actually seem to make more sense...
  // given that we call the code itself integration
  const formSchema = zRaw.integration
    .pick({endUserAccess: true})
    .extend({config: z.object({})})

  const {orgId} = useCurrengOrg()

  const [open, setOpen] = React.useState(false)
  const verb = int ? 'Edit' : 'Add'
  const {toast} = useToast()

  const upsertIntegration = _trpcReact.adminUpsertIntegration.useMutation({
    onSuccess: () => {
      setOpen(false)
      toast({title: 'Integration saved', variant: 'success'})
    },
    onError: (err) => {
      toast({
        title: 'Failed to save integration',
        description: `${err}`,
        variant: 'destructive',
      })
    },
  })
  const deleteIntegration = _trpcReact.adminDeleteIntegration.useMutation({
    onSuccess: () => {
      setOpen(false)
      toast({title: 'Integration deleted', variant: 'success'})
    },
    onError: (err) => {
      toast({
        title: 'Failed to create integration saved',
        description: `${err}`,
        variant: 'destructive',
      })
    },
  })
  const mutating = deleteIntegration.isLoading || upsertIntegration.isLoading

  const formRef = React.useRef<SchemaFormElement>(null)

  if (!connector) {
    return <LoadingText className="block p-4" />
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="mt-2" variant="ghost">
          {verb}
        </Button>
      </SheetTrigger>
      <SheetContent
        position="right"
        size="lg"
        className="flex flex-col bg-background">
        <SheetHeader className="shrink-0">
          <SheetTitle>
            {verb} {connector.displayName} connector config
          </SheetTitle>

          <div className="flex max-h-[100px] flex-row items-center justify-between">
            {connector.logoUrl ? (
              <Image
                width={100}
                height={100}
                src={connector.logoUrl}
                alt={connector.displayName}
              />
            ) : (
              <span>{connector.displayName}</span>
            )}
            <Badge
              variant="secondary"
              className={cn(
                'ml-auto',
                connector.stage === 'ga' && 'bg-green-200',
                connector.stage === 'beta' && 'bg-blue-200',
                connector.stage === 'alpha' && 'bg-pink-50',
              )}>
              {connector.stage}
            </Badge>
            {/* Add help text here */}
          </div>

          <SheetDescription>
            {int && `ID: ${int.id}`}
            <br />
            Supported mode(s): {connector.supportedModes.join(', ')}
          </SheetDescription>
        </SheetHeader>
        <Separator orientation="horizontal" />
        <div className="grow overflow-scroll">
          <SchemaForm
            ref={formRef}
            schema={formSchema}
            jsonSchemaTransform={(schema) => ({
              ...schema,
              properties: {
                ...schema.properties,
                ...(connector.schemas.integrationConfig && {
                  config: connector.schemas.integrationConfig,
                }),
              },
            })}
            formData={
              int
                ? {endUserAccess: int.endUserAccess, config: int.config ?? {}} // {} because required
                : undefined
            }
            // formData should be non-null at this point, we should fix the typing
            loading={upsertIntegration.isLoading}
            onSubmit={({formData}) => {
              console.log('formData submitted', formData)
              upsertIntegration.mutate({
                ...formData,
                ...(int ? {id: int.id} : {connectorName}),
                orgId,
              })
            }}
            hideSubmitButton
          />
          {!connector.schemas.integrationConfig && (
            <p>No configuration needed</p>
          )}
        </div>
        <Separator orientation="horizontal" />
        <SheetFooter className="shrink-0">
          {int && (
            <AlertDialog>
              <AlertDialogTrigger className="mr-auto">
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Confirm delete {connector.displayName} integration?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    ID: {int.id}
                    <br />
                    This action cannot be undone. In order to to delete an
                    integration, you may need to first delete all the resources
                    that depend on this integration first
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      disabled={mutating}
                      className="mr-auto"
                      // Specifying asChild and using this variant does not appear to be
                      // working for some reason...
                      variant="destructive"
                      onClick={() => deleteIntegration.mutate({id: int.id})}>
                      {deleteIntegration.isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Delete
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            disabled={mutating}
            type="submit"
            onClick={() => formRef.current?.submit()}>
            {upsertIntegration.isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {int ? 'Save' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

const ProviderCard = (props: React.ComponentProps<typeof _ProviderCard>) => (
  <_ProviderCard Image={Image as any} showStageBadge {...props} />
)

const IntegrationCard = (
  props: React.ComponentProps<typeof _IntegrationCard>,
) => <_IntegrationCard Image={Image as any} showStageBadge {...props} />