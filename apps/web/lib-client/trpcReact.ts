import type {TRPCReact} from '@openint/engine-frontend'
import {_trpcReact} from '@openint/engine-frontend'
import type {AppRouter} from '@openint/api'

/** Move this somewhere where other components can access */
export const trpcReact = _trpcReact as unknown as TRPCReact<AppRouter>
