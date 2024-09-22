import {z} from '@opensdks/util-zod'
import {kApikeyMetadata} from '@openint/app-config/constants'
import {zId} from '@openint/cdk'

const zPostgresUrl = z
  .string()
  .refine(
    (input) => ['postgres:', 'postgresql:'].includes(new URL(input).protocol),
    {message: 'Invalid PostgreSQL URL format'},
  )

export const zOrganization = z.object({
  id: zId('org'),
  slug: z.string().nullish(),
  // TODO: Add client side encryption for sensitive metadata
  publicMetadata: z.object({
    database_url: zPostgresUrl.optional().openapi({
      title: 'PostgreSQL Database URL',
      description: 'This is where data from resources are synced to by default',
      example: 'postgres://username:password@host:port/database',
    }),
    synced_data_schema: z.string().optional().openapi({
      title: 'Synced Data Schema',
      description:
        'Postgres schema to pipe data synced from end user resources into. Defaults to "synced" if missing.',
    }),
    webhook_url: z.string().optional().openapi({
      title: 'Webhook URL',
      description:
        'Events like sync.completed and connection.created can be sent to url of your choosing',
    }),
  }),
  privateMetadata: z.object({
    [kApikeyMetadata]: z.string().optional(),
  }),
})

export const zUser = z.object({
  id: zId('user'),
  publicMetadata: z.object({}),
  privateMetadata: z.object({}),
  unsafeMetadata: z.object({}),
})
