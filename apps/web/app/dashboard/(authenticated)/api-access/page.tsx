import {kApikeyHeader, kApikeyUrlParam} from '@openint/app-config/constants'
import {Input, Label} from '@openint/ui/shadcn'
import {getOrCreateApikey} from '@/lib-server'
import {serverComponentGetViewer} from '@/lib-server/server-component-helpers'

export default async function ApiKeyPage() {
  const viewer = await serverComponentGetViewer()
  const apikey = await getOrCreateApikey(viewer)

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-semibold tracking-tight">API</h2>

      <div className="mt-4 flex items-center">
        <Label className="mr-4 shrink-0" htmlFor="apikey">
          API Key
        </Label>
        <Input className="font-mono" readOnly value={apikey} />
      </div>
      <p className="mt-4">
        Use `{kApikeyHeader}` header or `{kApikeyUrlParam}` url param{' '}
      </p>
    </div>
  )
}
