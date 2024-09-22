'use client'

import {AppRouter} from '@openint/api'
import {zOrganization} from '@openint/api/platform-models'
import {
  _trpcReact,
  formatTRPCClientError,
  TRPCReact,
} from '@openint/engine-frontend'
import {SchemaForm, useToast} from '@openint/ui'

const trpcReact = _trpcReact as unknown as TRPCReact<AppRouter>

export default function SettingsPage() {
  const res = trpcReact.getCurrentOrganization.useQuery()

  const {toast} = useToast()

  const updateOrg = trpcReact.updateCurrentOrganization.useMutation({
    onSuccess: () => {
      toast({title: 'Organization updated', variant: 'success'})
    },
    onError: (err) => {
      toast({
        title: 'Failed to save organization',
        description: formatTRPCClientError(err),
        variant: 'destructive',
      })
    },
  })

  if (!res.data) {
    return null
  }

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">Settings</h2>
      {/* <div>Webhook url URL</div> */}


      <SchemaForm
        schema={zOrganization.shape.publicMetadata.pick({
          database_url: true,
        })}
        uiSchema={{
          // Would be nice if this can be extracted from example field of the openapi spec
          database_url: {
            'ui:placeholder': 'postgres://username:password@host:port/database',
          },
        }}
        formData={res.data.publicMetadata}
        loading={updateOrg.isLoading}
        onSubmit={async ({formData}) => {
          updateOrg.mutate({publicMetadata: formData})
          console.log('submit', formData)
        }}
      />
    </div>
  )
}
