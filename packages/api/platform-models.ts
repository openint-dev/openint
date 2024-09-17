import {z} from '@opensdks/util-zod'
import {kApikeyMetadata} from '@openint/app-config/constants'
import {zId} from '@openint/cdk'

export const zOrganization = z.object({
  id: zId('org'),
  slug: z.string(),
  publicMetadata: z.object({}),
  // TODO: Add client side encryption
  privateMetadata: z.object({
    [kApikeyMetadata]: z.string().optional(),
    webhook_url: z
      .string()
      .optional()
      .describe('This is a postgres database only right now'),
    database_url: z.string().optional(),
  }),
})

export const zUser = z.object({
  id: zId('user'),
  publicMetadata: z.object({}),
  privateMetadata: z.object({}),
  unsafeMetadata: z.object({}),
})
