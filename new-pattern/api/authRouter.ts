import {clerkClient} from '@clerk/nextjs'
import {z} from '@opensdks/util-zod'
import {TRPCError} from '@trpc/server'
import {
  kApikeyMetadata,
  kWebhookUrlMetadata,
} from '@openint/app-config/constants'
import type {Viewer} from '@openint/cdk'
import {zId, zViewer} from '@openint/cdk'
import {
  adminProcedure,
  publicProcedure,
  trpc,
} from '@openint/engine-backend/router/_base'

export type ClerkOrg = Awaited<
  ReturnType<(typeof clerkClient)['organizations']['getOrganization']>
>

export type ClerkUser = Awaited<
  ReturnType<(typeof clerkClient)['users']['getUser']>
>

export function zOrgMetadata() {
  return z.object({})
}

export const zAuth = {
  organization: z.object({
    id: zId('org'),
    slug: z.string(),
    publicMetadata: zOrgMetadata(),
    privateMetadata: z.object({
      [kApikeyMetadata]: z.string().optional(),
      [kWebhookUrlMetadata]: z.string().optional(),
    }),
  }),

  user: z.object({
    id: zId('user'),
    publicMetadata: z.object({}),
    privateMetadata: z.object({}),
    unsafeMetadata: z.object({}),
  }),
}

export type ZAuth = {
  [k in keyof typeof zAuth]: z.infer<(typeof zAuth)[k]>
}

export const authRouter = trpc.router({
  getViewer: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/viewer',
        summary: 'Get current viewer accessing the API',
      },
    })
    .input(z.void())
    .output(zViewer)
    .query(async ({ctx}) => {
      const extra =
        ctx.viewer.role === 'org'
          ? await clerkClient.organizations.getOrganization({
              organizationId: ctx.viewer.orgId,
            })
          : ctx.viewer.role === 'user'
            ? await clerkClient.users.getUser(ctx.viewer.userId)
            : undefined

      return {...ctx.viewer, extra} as Viewer
    }),
  updateOrganization: adminProcedure
    .input(zAuth.organization.pick({id: true, publicMetadata: true}))
    .mutation(async ({ctx, input: {id, ...update}}) => {
      if (ctx.viewer.role !== 'system' && ctx.viewer.orgId !== id) {
        throw new TRPCError({code: 'UNAUTHORIZED'})
      }
      const org = await clerkClient.organizations.updateOrganization(id, update)
      return org
    }),
})
