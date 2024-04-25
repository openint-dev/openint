import {clerkClient} from '@clerk/nextjs'
import {createOpenApiFetchHandler} from '@lilyrose2798/trpc-openapi'
import {backendEnv, contextFactory} from '@openint/app-config/backendConfig'
import {
  kAccessToken,
  kApikeyHeader,
  kApikeyMetadata,
  kApikeyUrlParam,
} from '@openint/app-config/constants'
import type {Id, Viewer} from '@openint/cdk'
import {decodeApikey, makeJwtClient} from '@openint/cdk'
import {isHttpError, z} from '@openint/vdk'
import {appRouter} from './appRouter'

export const zOpenIntHeaders = z
  .object({
    [kApikeyHeader]: z.string().nullish(),
    'x-resource-id': z.string().nullish(),
    authorization: z.string().nullish(), // `Bearer ${string}`
  })
  .catchall(z.string().nullish())

export type OpenIntHeaders = z.infer<typeof zOpenIntHeaders>

/** Determine the current viewer in this order
 * access token via query param
 * access token via header
 * apiKey via query param
 * api key via header
 * next.js cookie
 * fall back to anon viewer
 * TODO: Figure out how to have the result of this function cached for the duration of the request
 * much like we cache
 */
export async function viewerFromRequest(
  req: Request,
  // This is a hack for not knowing how else to return accessToken...
  // and not wanting it to add it to the super simple viewer interface just yet
  // Fwiw this is only used for the /connect experience and not generally otherwise
): Promise<Viewer & {accessToken?: string | null}> {
  const jwt = makeJwtClient({
    secretOrPublicKey: backendEnv.JWT_SECRET_OR_PUBLIC_KEY,
  })

  // console.log('headers', headers)
  // console.log('searchParams', searchParams)

  const url = new URL(req.url)

  // access token via query param
  let accessToken = url.searchParams.get(kAccessToken) ?? undefined

  let viewer = jwt.verifyViewer(accessToken)
  if (viewer.role !== 'anon') {
    return {...viewer, accessToken}
  }
  // access token via header
  accessToken = req.headers.get('authorization')?.match(/^Bearer (.+)/)?.[1]
  viewer = jwt.verifyViewer(accessToken)
  if (viewer.role !== 'anon') {
    return {...viewer, accessToken}
  }

  // personal access token via query param or header
  const apikey =
    url.searchParams.get(kApikeyUrlParam) || req.headers.get(kApikeyHeader)

  // No more api keys, gotta fix me here.
  if (apikey) {
    const [id, key] = decodeApikey(apikey)

    const res = id.startsWith('user_')
      ? await clerkClient.users.getUser(id)
      : id.startsWith('org_')
        ? await clerkClient.organizations.getOrganization({organizationId: id})
        : null

    // console.log('apikey', {apiKey: apikey, id, key, res})

    if (res?.privateMetadata?.[kApikeyMetadata] === key) {
      return res.id.startsWith('user_')
        ? {role: 'user', userId: res.id as Id['user']}
        : {role: 'org', orgId: res.id as Id['org']}
    }
    // console.warn('Invalid api key, ignoroing', {apiKey: apikey, id, key, res})
  }
  return {role: 'anon'}
}

// TODO: Make me work
export function createAppHandler({
  endpoint = '/api/v0',
}: {
  endpoint?: `/${string}`
} = {}) {
  return (req: Request) =>
    createOpenApiFetchHandler({
      endpoint,
      req,
      router: appRouter,
      createContext: async ({req}) => {
        const viewer = await viewerFromRequest(req)
        console.log('[trpc.createContext]', {url: req.url, viewer})
        return {
          ...contextFactory.fromViewer(viewer),
          remoteResourceId:
            (req.headers.get('x-resource-id') as Id['reso']) ?? null,
        }
      },
      // TODO: handle error status code from passthrough endpoints
      // onError, // can only have side effect and not modify response error status code unfortunately...
      responseMeta: ({errors, ctx: _ctx}) => {
        // Pass the status along
        for (const err of errors) {
          console.warn(
            '[TRPCError]',
            {
              // customerId: ctx?.headers.get('x-customer-id'),
              // providerName: ctx?.headers.get('x-provider-name'),
            },
            err,
          )
          if (isHttpError(err.cause)) {
            // Maybe rename this to status within the error object?
            return {status: err.cause.code}
          }
        }
        return {}
      },
    })
}
