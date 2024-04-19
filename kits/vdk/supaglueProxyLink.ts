import type {Link as FetchLink} from '@opensdks/fetch-links'
import {mergeHeaders, modifyRequest} from '@opensdks/fetch-links'
import {z} from '@opensdks/util-zod'
import {NotAuthenticatedError} from './errors'

interface SupaglueHeaders {
  'x-api-key': string
  'x-customer-id': string
  'x-provider-name': string
}
/** https://docs.supaglue.com/api/v2/actions/send-passthrough-request */
export function supaglueProxyLink(opts: {
  apiKey: string
  /** `x-customer-id` header */
  customerId: string
  /** `x-provider-name` header */
  providerName: string
}): FetchLink {
  const supaglueHeaders = {
    'x-api-key': opts.apiKey,
    'x-customer-id': opts.customerId,
    'x-provider-name': opts.providerName,
  } satisfies SupaglueHeaders

  return async (req, next) => {
    const url = new URL(req.url)
    // Can be JSON object or text, Supaglue will accept either
    // prefer to send as JSON to make the underlying network request easier to debug compare to
    // stringfied JSON escaped into another string
    const requestBody = await req.text().then(safeJsonParse)

    const res = await next(
      modifyRequest(req, {
        url: 'https://api.supaglue.io/actions/v2/passthrough',
        headers: mergeHeaders(req.headers, supaglueHeaders),
        method: 'POST',
        body: JSON.stringify({
          path: url.pathname,
          method: req.method,
          headers: Object.fromEntries(req.headers.entries()),
          query: Object.fromEntries(url.searchParams.entries()),
          // Sending body for get / head requests results in failure
          ...((requestBody as string) && {body: requestBody}),
        }),
      }),
    )
    if (res.status === 500) {
      const resBody = zErrorBody.safeParse(await res.clone().json())
      const authError =
        resBody.success &&
        resBody.data.errors.find(
          (e) => e.code === 'SG_CONNECTION_NO_LONGER_AUTHENTICATED_ERROR',
        )

      if (authError) {
        throw new NotAuthenticatedError(
          `${opts.customerId}/${opts.providerName}: ${authError.status}`,
          {
            customerId: opts.customerId,
            providerName: opts.providerName,
            ...resBody.data,
          },
        )
      }
    }
    if (res.status !== 200) {
      return res
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const resJson: {
      url: string
      status: number
      headers: Record<string, string>
      body: string | object
    } = await res.json()
    return new Response(
      typeof resJson.body === 'string'
        ? resJson.body
        : JSON.stringify(resJson.body),
      {
        headers: resJson.headers,
        status: resJson.status,
        statusText: `From ${resJson.url}`,
      },
    )
  }
}

function safeJsonParse(s: string): unknown {
  try {
    return JSON.parse(s)
  } catch {
    return s
  }
}

/**
 * e.g.
{
  "errors": [
    {
      "id": "90baefbd-ece5-4f51-bbaa-4dabdbf122b5",
      "title": "expired access/refresh token",
      "detail": "expired access/refresh token",
      "problem_type": "SG_CONNECTION_NO_LONGER_AUTHENTICATED_ERROR",
      "code": "SG_CONNECTION_NO_LONGER_AUTHENTICATED_ERROR",
      "meta": {
        "origin": "supaglue",
        "application_name": "Ignition Production"
      },
      "status": "invalid_grant: expired access/refresh token"
    }
  ]
}
 */
const zErrorBody = z.object({
  errors: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional(),
      detail: z.string().optional(),
      problem_type: z.string().optional(),
      code: z.string(),
      meta: z
        .object({origin: z.string(), application_name: z.string()})
        .optional(),
      status: z.string(),
    }),
  ),
})
