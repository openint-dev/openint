import {clerkClient} from '@clerk/nextjs'
import {z} from '@opensdks/util-zod'
import {TRPCError} from '@trpc/server'
import type {Viewer} from '@openint/cdk'
import {zViewer} from '@openint/cdk'
import {
  adminProcedure,
  publicProcedure,
  trpc,
} from '@openint/engine-backend/router/_base'
import {R} from '@openint/util'
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

  getCurrentOrganization: adminProcedure.query(async ({ctx}) => {
    if (!ctx.viewer.orgId) {
      throw new TRPCError({code: 'BAD_REQUEST', message: 'orgId needed'})
    }
    const org = await clerkClient.organizations.getOrganization({
      organizationId: ctx.viewer.orgId,
    })
    return R.pick(org, [
      'id',
      'publicMetadata',
      'name',
      'slug',
      'imageUrl',
      'createdAt',
      'updatedAt',
      'members_count',
    ])
  }),

  updateCurrentOrganization: adminProcedure
    .input(zOrganization.pick({publicMetadata: true}))
    .mutation(async ({ctx, input: update}) => {
      if (!ctx.viewer.orgId) {
        throw new TRPCError({code: 'BAD_REQUEST', message: 'orgId needed'})
      }
      const org = await clerkClient.organizations.updateOrganization(
        ctx.viewer.orgId,
        update,
      )
      return org
    }),
})
