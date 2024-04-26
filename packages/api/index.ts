import {appRouter} from './appRouter'
import {createHandler} from './createAppHandler'

export * from './appRouter'
export * from './createAppHandler'

// TODO: Make me work
export function createAppHandler(
  opts: {
    endpoint?: `/${string}`
  } = {},
) {
  return createHandler({...opts, router: appRouter})
}
