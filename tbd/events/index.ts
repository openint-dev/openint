import {EventSchemas, Inngest} from 'inngest'
import {eventsMap} from './events'

export const inngest = new Inngest({
  id: 'build-your-own-supaglue',
  schemas: new EventSchemas().fromZod(eventsMap),
})

export * from './events'
