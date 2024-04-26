import {getRemoteContext} from '@openint/cdk'
import {getProtectedContext} from '@openint/trpc'
import {contextFromRequest} from './createRouterHandler'

export const proxyHandler = async (req: Request) => {
  const ctx = await contextFromRequest({req})
  const protectedContext = getProtectedContext(ctx)
  const remoteContext = await getRemoteContext(protectedContext)
  const res = await remoteContext.remote.connector.proxy?.(
    remoteContext.remote.instance,
    req,
  )
  if (!res) {
    return new Response(`Not implemented: ${remoteContext.remoteResourceId}`, {
      status: 404,
    })
  }
  return res
}
