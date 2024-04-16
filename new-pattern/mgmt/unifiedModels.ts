import {z} from '@openint/vdk2'

/** workaround the issue that we get back date from db... need to figure out how to just get string */
// const zTimestamp = z
//   .union([z.string(), z.date()])
//   .describe('ISO8601 date string')

// const dbRecord = z.object({
//   // id: z.string(),
//   /** z.string().datetime() does not work for simple things like `2023-07-19T23:46:48.000+0000`  */
//   updated_at: zTimestamp,
//   created_at: zTimestamp,
// })

export const customer = z
  .object({
    customer_id: z.string(),
    name: z.string().nullish(),
    email: z
      .string()
      .nullish()
      .describe(
        'Email, but not validated as data from Supaglue has invalid emails for now',
      ),
  })
  .openapi({ref: 'customer'})

export const connection = z
  .object({
    id: z.string(),
    customer_id: z.string(),
    provider_name: z.string(),
  })
  .openapi({ref: 'connection'})
export type Connection = z.infer<typeof connection>

export const connection_sync_config = z
  .object({
    destination_config: z
      .object({type: z.string(), schema: z.string().nullish()})
      .nullish(),

    unified_objects: z.array(z.object({object: z.string()})).nullish(),
    standard_objects: z.array(z.object({object: z.string()})).nullish(),
    custom_objects: z.array(z.object({object: z.string()})).nullish(),
  })
  .openapi({ref: 'connection_sync_config'})
export type ConnectionSyncConfig = z.infer<typeof connection_sync_config>

export const sync_config = z
  .intersection(
    connection_sync_config,
    z.object({
      provider_name: z.string(),
      auto_start_on_connection: z
        .boolean()
        .nullish()
        .describe(
          'If true, the sync will start automatically when the connection is created.',
        ),
    }),
  )
  .openapi({ref: 'sync_config'})
export type SyncConfig = z.infer<typeof sync_config>
