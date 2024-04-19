import {envRequired} from '@openint/env'
import {inngest} from '@openint/events'
import {z} from '@openint/vdk'
import {
  fromNangoConnectionId,
  fromNangoProviderConfigKey,
  toNangoConnectionId,
  toNangoProviderConfigKey,
} from '@openint/vdk/nangoProxyLink'
import cookie from 'cookie'

const zOauthInitParams = z.object({
  customer_id: z.string(),
  provider_name: z.string(),
  scope: z.string().optional(),
  return_url: z.string().optional(),
  state: z.string().optional(),
  // we don't need application_id here for now
})

export type OAuthInitParams = z.infer<typeof zOauthInitParams>

const zCookie = zOauthInitParams.pick({state: true, return_url: true})

// TODO: Put helpers for how to construct a connect url into a published SDK
// even if it's just a standalone package

export function nangoAuthCreateInitHandler({
  getServerUrl,
}: {
  getServerUrl: (req: Request) => string
}) {
  return async function GET(req: Request) {
    const reqUrl = new URL(req.url)
    const params = zOauthInitParams.parse(
      Object.fromEntries(reqUrl.searchParams.entries()),
    )

    // TODO: put this into sdk-nango
    const nangoConnectUrl = new URL(
      `https://api.nango.dev/oauth/connect/${toNangoProviderConfigKey(
        params.provider_name,
      )}`,
    )
    nangoConnectUrl.searchParams.set(
      'connection_id',
      toNangoConnectionId(params.customer_id),
    )
    nangoConnectUrl.searchParams.set(
      'public_key',
      envRequired.NEXT_PUBLIC_NANGO_PUBLIC_KEY,
    )

    const res = await fetch(nangoConnectUrl, {redirect: 'manual'})
    const location = res.headers.get('location')
    if (res.status !== 302 || !location) {
      throw new Error('Missing redirect from nango /oauth/connect response')
    }

    const oauthUrl = new URL(location)
    const redirectUri = new URL(
      '/connect/callback',
      getServerUrl(req),
    ).toString()

    if (oauthUrl.searchParams.get('redirect_uri') !== redirectUri) {
      // redirect_uri is needed when exchanging code later. Nango needs to know the right value otherwise code exchange will fail during callback
      throw new Error(
        `Please set your callback url to ${redirectUri} in your nango project settings`,
      )
    }
    // Override default scope set by Nango
    if (params.scope && params.scope !== 'undefined') {
      // catch undefined from bad consumer redirects
      oauthUrl.searchParams.set('scope', params.scope)
    }
    // Persist state for later retrieval
    const cookieKey = oauthUrl.searchParams.get('state') // nango state uuid
    const cookieValue = JSON.stringify({
      return_url: params.return_url,
      state: params.state,
    } as z.infer<typeof zCookie>)

    return new Response(null, {
      status: 307, // temp redirect
      headers: {
        location: oauthUrl.toString(),
        // For whatever reason cookie is visible on /connect/* but not on / root page
        'set-cookie': cookie.serialize(`state-${cookieKey}`, cookieValue),
      },
    })
  }
}

export async function nangoAuthCallbackHandler(req: Request) {
  const reqUrl = new URL(req.url)

  const cookies = cookie.parse(req.headers.get('cookie') ?? '')
  const cookieKey = reqUrl.searchParams.get('state') // nango state uuid
  const cookieValue = cookies[`state-${cookieKey}`]
  const initParams = zCookie.parse(JSON.parse(cookieValue!))

  const nangoCallbackUrl = new URL('https://api.nango.dev/oauth/callback')
  reqUrl.searchParams.forEach((value, key) => {
    nangoCallbackUrl.searchParams.append(key, value)
  })

  const event = await fetch(nangoCallbackUrl, {redirect: 'manual'})
    .then((res) => res.text())
    .then(parseNangoOauthCallbackPage)

  const returnParams = {
    result:
      event?.eventType === 'AUTHORIZATION_SUCEEDED'
        ? ('SUCCESS' as const)
        : ('ERROR' as const),
    state: initParams.state,
  }

  if (event?.eventType === 'AUTHORIZATION_SUCEEDED') {
    const data = {
      customer_id: fromNangoConnectionId(event.data.connectionId),
      provider_name: fromNangoProviderConfigKey(event.data.providerConfigKey),
    }
    Object.assign(returnParams, data)

    // Is there a way we can do this asynchronously AFTER the response is sent on Vercel?
    // both webhook and immediate sync shall be triggered on connection.created event
    await inngest.send([{name: 'connection.created', data}])
  } else if (event?.eventType === 'AUTHORIZATION_FAILED') {
    Object.assign(returnParams, {
      error_type: event.data.authErrorType,
      error_detail: event.data.authErrorDesc,
    })
  }

  const returnUrl = initParams.return_url
    ? new URL(initParams.return_url)
    : null

  Object.entries(returnParams).forEach(([key, value]) => {
    if (value) {
      returnUrl?.searchParams.append(key, value)
    }
  })

  // For response body / 200 response is used for debugging
  return new Response(JSON.stringify({initParams, returnParams}), {
    status: returnUrl ? 307 : 200,
    headers: {
      'content-type': 'application/json',
      ...(returnUrl && {location: returnUrl.toString()}),
    },
  })
}

const zNangoOauthCallbackMessage = z.discriminatedUnion('eventType', [
  z.object({
    eventType: z.literal('AUTHORIZATION_SUCEEDED'),
    data: z.object({providerConfigKey: z.string(), connectionId: z.string()}),
  }),
  z.object({
    eventType: z.literal('AUTHORIZATION_FAILED'),
    data: z.object({authErrorDesc: z.string(), authErrorType: z.string()}),
  }),
])

function parseNangoOauthCallbackPage(html: string) {
  const parseStrVar = (name: string) =>
    html
      .match(new RegExp(`${name.replace('.', '.')} = (?:'|\`|")(.*)`))?.[1]
      ?.replace(/('|`|");?$/, '')

  const eventType = parseStrVar('message.eventType')

  const authErrorType = parseStrVar('window.authErrorType')
  const authErrorDesc = parseStrVar('window.authErrorDesc')

  const providerConfigKey = parseStrVar('window.providerConfigKey')
  const connectionId = parseStrVar('window.connectionId')

  const res = zNangoOauthCallbackMessage.safeParse({
    eventType,
    data: {providerConfigKey, connectionId, authErrorDesc, authErrorType},
  })
  return res.success ? res.data : undefined
}
