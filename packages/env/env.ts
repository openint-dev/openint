import {z} from '@opensdks/util-zod'
import {createEnv} from '@t3-oss/env-nextjs'
import {proxyRequired} from './proxyRequired'

export const env = createEnv({
  server: {
    // Variables set by Vercel when deployed
    VERCEL_URL: z.string().optional(),

    // MARK: - Not validated, may not be used...
    // Core env vars
    POSTGRES_URL: z.string().default('postgres://localhost:5432/postgres'),
    // TODO: Incorporate schema in the url itself.
    POSTGRES_SCHEMA: z.string().optional(),

    // Required for worker to work when deployed
    INNGEST_SIGNING_KEY: z.string().optional(),
    INNGEST_EVENT_KEY: z.string().optional(),

    // Set if you want to receive webhooks for all the events
    WEBHOOK_URL: z.string().optional(),
    WEBHOOK_SECRET: z.string().optional(),

    // Turn on debug output, including drizzle. Should be a boolean tho
    DEBUG: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SERVER_URL: z.string().optional(),
    NEXT_PUBLIC_NANGO_PUBLIC_KEY: z.string().optional(),
    // Where the app is running. Only used by getServerUrl at the moment
    NEXT_PUBLIC_PORT: z.string().optional(),
  },
  runtimeEnv: {
    DEBUG: process.env['DEBUG'],
    POSTGRES_SCHEMA: process.env['POSTGRES_SCHEMA'],
    INNGEST_EVENT_KEY: process.env['INNGEST_EVENT_KEY'],
    INNGEST_SIGNING_KEY: process.env['INNGEST_SIGNING_KEY'],
    NEXT_PUBLIC_NANGO_PUBLIC_KEY: process.env['NEXT_PUBLIC_NANGO_PUBLIC_KEY'],
    NEXT_PUBLIC_PORT: process.env['NEXT_PUBLIC_PORT'],
    NEXT_PUBLIC_SERVER_URL: process.env['NEXT_PUBLIC_SERVER_URL'],
    POSTGRES_URL: process.env['POSTGRES_URL'],
    VERCEL_URL: process.env['VERCEL_URL'],
    WEBHOOK_SECRET: process.env['WEBHOOK_SECRET'],
    WEBHOOK_URL: process.env['WEBHOOK_URL'],
  },
})

export const envRequired = proxyRequired(env, {
  formatError(key) {
    return new Error(`Missing required env var: ${key}`)
  },
})
