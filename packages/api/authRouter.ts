import {clerkClient} from '@clerk/nextjs'
import type {Viewer} from '@openint/cdk'
import {zViewer} from '@openint/cdk'
import {
  adminProcedure,
  publicProcedure,
  trpc,
} from '@openint/engine-backend/router/_base'
import {z} from '@opensdks/util-zod'
import {TRPCError} from '@trpc/server'
import {zOrganization} from './platform-models'

export type ClerkOrg = Awaited<
  ReturnType<(typeof clerkClient)['organizations']['getOrganization']>
>

export type ClerkUser = Awaited<
  ReturnType<(typeof clerkClient)['users']['getUser']>
>

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
    .input(zOrganization.pick({id: true, publicMetadata: true}))
    .mutation(async ({ctx, input: {id, ...update}}) => {
      if (ctx.viewer.role !== 'system' && ctx.viewer.orgId !== id) {
        throw new TRPCError({code: 'UNAUTHORIZED'})
      }
      const org = await clerkClient.organizations.updateOrganization(id, update)
      return org
    }),
})
