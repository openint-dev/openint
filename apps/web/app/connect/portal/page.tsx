// import {clerkClient} from '@clerk/nextjs'
// import Image from 'next/image'
import {kAccessToken} from '@openint/app-config/constants'
import {getViewerId} from '@openint/cdk'
import {zConnectPageParams} from '@openint/engine-backend/router/endUserRouter'
import {ClientRoot} from '@/components/ClientRoot'
import {SuperHydrate} from '@/components/SuperHydrate'
import {createServerComponentHelpers} from '@/lib-server/server-component-helpers'
import ConnectionPortal from './ConnectionPortal'

export const metadata = {
  title: 'OpenInt Connect',
}

/**
 * Workaround for searchParams being empty on production. Will ahve to check
 * @see https://github.com/vercel/next.js/issues/43077#issuecomment-1383742153
 */
export const dynamic = 'force-dynamic'

// Should we allow page to optionally load without token for performance then add token async
// Perhaps it would even be an advantage to have the page simply be static?
// Though that would result in waterfall loading of integrations

/** https://beta.nextjs.org/docs/api-reference/file-conventions/page#searchparams-optional */
export default async function ConnectPageContainer({
  searchParams,
}: {
  // Only accessible in PageComponent rather than layout component
  // @see https://github.com/vercel/next.js/issues/43704
  searchParams: Record<string, string | string[] | undefined>
}) {
  const {token} = zConnectPageParams.parse(searchParams)
  const {getDehydratedState, viewer} = await createServerComponentHelpers({
    searchParams: {[kAccessToken]: token},
  })
  if (viewer.role !== 'end_user') {
    return (
      <div>Authenticated user only. Your role is {getViewerId(viewer)}</div>
    )
  }

  return (
    <div className="h-screen w-screen p-6">
      <ClientRoot accessToken={viewer.accessToken} authStatus="success">
        <SuperHydrate dehydratedState={getDehydratedState()}>
          <ConnectionPortal />
        </SuperHydrate>
      </ClientRoot>
    </div>
  )
}
