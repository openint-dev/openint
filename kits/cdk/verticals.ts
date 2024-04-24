// TODO: Refactor vertical specific logic out of connectors and thus cdk
// Should be self-contained inside each vertical instead.

import type * as Pta from '../../verticals/vertical-pta/pta-types'

export * from '../../verticals/vertical-banking'
export * from '../../verticals/vertical-investment'

// TODO: Deprecate all of these...
export type {Pta}
export * from '../../verticals/vertical-pta/pta-utils'
