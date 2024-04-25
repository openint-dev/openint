import {TRPCError} from '@trpc/server'

export function decodeApikey(apikey: string) {
  try {
    const [id, key, ...rest] = atob(apikey).split(':')
    if (!id || !key || rest.length > 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid API Key format',
      })
    }
    return [id, key] as const
  } catch (err) {
    if (`${err}`.includes('InvalidCharacterError')) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid API Key format',
      })
    }
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `${err}`,
    })
  }
}

export function encodeApiKey(id: string, key: string) {
  return btoa(`${id}:${key}`)
}
