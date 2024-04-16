import type {
  HttpMethod,
  JSONLike,
  PathsWithMethod,
  SuccessResponse,
} from 'openapi-typescript-helpers'

export * from './mapper'
export * from './pagination'
export * from './provider'
export * from './trpc'
export * from './type-utils/PathsOf'
export * from './type-utils/StrictObj'

export * from '@opensdks/fetch-links'
export * from '@opensdks/util-zod'

export type {
  OperationRequestBodyContent,
  PathsWithMethod,
} from 'openapi-typescript-helpers'

export type ResponseFrom<
  Paths extends {},
  M extends HttpMethod,
  P extends PathsWithMethod<Paths, M>,
> = JSONLike<
  SuccessResponse<
    M extends keyof Paths[P]
      ? 'responses' extends keyof Paths[P][M]
        ? Paths[P][M]['responses']
        : never
      : never
  >
>

export * from './errors'

// re-exporting utiltities

export {uniq, uniqBy, mapValues, mapKeys, pick} from 'remeda'
