import {and, eq, sql} from 'drizzle-orm'
import type {SendEventPayload} from 'inngest/helpers/types'
import {createAppHandler} from '@openint/api'
import {
  db,
  dbUpsert,
  ensureSchema,
  getCommonObjectTable,
  schema,
  stripNullByte,
} from '@openint/db'
import {env} from '@openint/env'
import type {Events} from '@openint/events'
import {initOpenIntSDK} from '@openint/sdk'
import {HTTPError, parseErrorInfo} from '../../packages/trpc/errors'

/**
 * Unlike functions, routines are designed to run without dependency on Inngest
 * So they can be used with any job queue system, such as BullMQ or home grown system built
 * on top of postgres / redis / pubsub / whatever.
 */
export type FunctionInput<T extends keyof Events> = {
  // NOTE: This is not the full set of fields exposed by Inngest. there are more...
  event: {data: Events[T]['data']; id?: string; name: T}
  step: {
    run: <T>(name: string, fn: () => Promise<T>) => Promise<T> | T
    sendEvent: (
      stepId: string,
      events: SendEventPayload<Events>,
    ) => Promise<unknown> // SendEventOutput
  }
}
type SingleNoArray<T> = T extends Array<infer U> ? U : T
export type EventPayload = SingleNoArray<SendEventPayload<Events>>

export async function scheduleSyncs({
  step,
  event,
}: FunctionInput<'scheduler.requested'>) {
  console.log('[scheduleSyncs]', event)
  const byos = initOpenIntSDK({
    headers: {
      'x-api-key': env.SUPAGLUE_API_KEY,
      'x-nango-secret-key': env.NANGO_SECRET_KEY,
    },
    // Bypass the normal fetch link http round-tripping back to our server and handle the BYOS request directly!
    // Though we are losing the ability to debug using Proxyman and others... So maybe make this configurable in
    // development
    links: [createAppHandler()],
  })

  const [syncConfigs, customers] = await Promise.all([
    byos.GET('/sync_configs').then((r) => r.data),
    byos.GET('/customers').then((r) => r.data),
  ])
  const connections = await Promise.all(
    customers.map((c) =>
      byos
        .GET('/customers/{customer_id}/connections', {
          params: {path: {customer_id: c.customer_id}},
        })
        .then((r) => r.data),
    ),
  ).then((nestedArr) => nestedArr.flat())

  const events = connections
    .map((c) => {
      if (!event.data.provider_names.includes(c.provider_name)) {
        // Only sync these for now...
        return null
      }
      console.log(
        `[scheduleSyncs] Will sendEvent for ${c.customer_id}:${c.provider_name}`,
      )
      const syncConfig = syncConfigs.find(
        (sc) => sc.provider_name === c.provider_name,
      )
      return {
        name: 'sync.requested',
        data: {
          customer_id: c.customer_id,
          provider_name: c.provider_name,
          vertical: event.data.vertical,
          unified_objects: syncConfig?.unified_objects?.map((o) => o.object),
          standard_objects: syncConfig?.standard_objects?.map((o) => o.object),
          destination_schema: env.DESTINATION_SCHEMA,
          sync_mode: event.data.sync_mode,
        },
      } satisfies EventPayload
    })
    .filter((c): c is NonNullable<typeof c> => !!c)

  console.log('[scheduleSyncs] Metrics', {
    num_customers: customers.length,
    num_connections: connections.length,
    num_connections_to_sync: events.length,
  })

  await step.sendEvent('emit-connection-sync-events', events)
  // make it easier to see...
  return events.map((e) => ({
    customer_id: e.data.customer_id,
    provider_name: e.data.provider_name,
  }))
}

const sqlNow = sql`now()`

// TODO: We should Cancel previous sync if it's still running...
// or not allow new syncs. Full sync should probably be prioritized over incremental syncs.
export async function syncConnection({
  event,
  step,
}: FunctionInput<'sync.requested'>) {
  const {
    data: {
      customer_id,
      provider_name,
      vertical,
      unified_objects = [],
      sync_mode = 'incremental',
      destination_schema,
      page_size,
      custom_objects = [],
      standard_objects = [],
    },
  } = event
  console.log('[syncConnection] Start', {
    customer_id,
    provider_name,
    eventId: event.id,
    sync_mode,
    vertical,
    unified_objects,
  })

  // This can probably be done via an upsert returning...
  const syncState = await db.query.sync_state
    .findFirst({
      where: and(
        eq(schema.sync_state.customer_id, customer_id),
        eq(schema.sync_state.provider_name, provider_name),
      ),
    })
    .then(
      (ss) =>
        ss ??
        // eslint-disable-next-line promise/no-nesting
        db
          .insert(schema.sync_state)
          .values({
            customer_id,
            provider_name,
            state: sql`${{}}::jsonb`,
          })
          .returning()
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          .then((rows) => rows[0]!),
    )

  const syncRunId = await db
    .insert(schema.sync_run)
    .values({
      input_event: sql`${event}::jsonb`,
      initial_state: sql`${syncState.state}::jsonb`,
      started_at: sqlNow,
    })
    .returning()
    .then((rows) => rows[0]!.id)

  const byos = initOpenIntSDK({
    headers: {
      'x-api-key': env.SUPAGLUE_API_KEY,
      'x-nango-secret-key': env.NANGO_SECRET_KEY,
      'x-customer-id': customer_id, // This relies on customer-id mapping 1:1 to connection_id
      'x-provider-name': provider_name, // This relies on provider_config_key mapping 1:1 to provider-name
    },
    // Bypass the normal fetch link http round-tripping back to our server and handle the BYOS request directly!
    // Though we are losing the ability to debug using Proxyman and others... So maybe make this configurable in
    // development
    links: [createAppHandler()],
  })

  const overallState = (syncState.state ?? {}) as Record<
    string,
    {cursor?: string | null}
  >

  let errorInfo: Awaited<ReturnType<typeof parseErrorInfo>> | undefined

  const metrics: Record<string, number | string> = {}

  function incrementMetric(name: string, amount = 1) {
    const metric = metrics[name]
    metrics[name] = (typeof metric === 'number' ? metric : 0) + amount
    return metrics[name] as number
  }
  function setMetric<T extends string | number>(name: string, value: T) {
    metrics[name] = value
    return metrics[name] as T
  }

  async function syncStreamPage(
    stream: string,
    table: ReturnType<typeof getCommonObjectTable>,
    state: {cursor?: string | null},
  ) {
    try {
      const res = await byos.GET(
        `/verticals/${vertical}/${stream}` as '/verticals/crm/contact',
        {params: {query: {cursor: state.cursor, page_size}}},
      )
      const count = incrementMetric(`${stream}_count`, res.data.items.length)
      incrementMetric(`${stream}_page_count`)
      console.log(`Syncing ${vertical} ${stream} count=${count}`)
      if (res.data.items.length) {
        await dbUpsert(
          db,
          table,
          res.data.items.map(({raw_data, ...item}) => ({
            // Primary keys
            _supaglue_application_id: env.SUPAGLUE_APPLICATION_ID,
            _supaglue_customer_id: customer_id, //  '$YOUR_CUSTOMER_ID',
            _supaglue_provider_name: provider_name,
            id: item.id,
            // Other columns
            created_at: sqlNow,
            updated_at: sqlNow,
            _supaglue_emitted_at: sqlNow,
            last_modified_at: sqlNow, // TODO: Fix me...
            is_deleted: false,
            // Workaround jsonb support issue... https://github.com/drizzle-team/drizzle-orm/issues/724
            raw_data: sql`${stripNullByte(raw_data) ?? null}::jsonb`,
            _supaglue_unified_data: sql`${stripNullByte(item)}::jsonb`,
          })),
          {
            insertOnlyColumns: ['created_at'],
            noDiffColumns: [
              '_supaglue_emitted_at',
              'last_modified_at',
              'updated_at',
            ],
          },
        )
      }
      return {
        next_cursor: res.data.next_cursor,
        has_next_page: res.data.has_next_page,
      }
    } catch (err) {
      // HTTP 501 not implemented
      if (err instanceof HTTPError && err.code === 501) {
        // NOTE: vercel doesn't understand console.warn unfortunately... so this will show up as error
        // https://vercel.com/docs/observability/runtime-logs#level
        console.warn(
          `[sync progress] ${provider_name} does not implement ${stream}`,
        )
        return {has_next_page: false, next_cursor: null}
      }
      throw err
    }
  }

  async function syncStream(stream: string) {
    const fullEntity = `${vertical}_${stream}`
    console.log('[syncConnection] Syncing', fullEntity)
    const table = getCommonObjectTable(fullEntity, {
      schema: destination_schema,
    })
    await db.execute(table.createIfNotExistsSql())
    const state = sync_mode === 'full' ? {} : overallState[stream] ?? {}
    overallState[stream] = state
    const streamSyncMode = state.cursor ? 'incremental' : 'full'
    setMetric(`${stream}_sync_mode`, streamSyncMode)

    while (true) {
      // const ret = await step.run(
      //   `${stream}-sync-${state.cursor ?? ''}`,
      //   iteratePage,
      // )
      const ret = await syncStreamPage(stream, table, state)
      console.log('[sync progress]', {
        stream,
        completed_cursor: state.cursor,
        ...ret,
      })
      state.cursor = ret.next_cursor
      // Persist state. TODO: Figure out how to make this work with step function
      await Promise.all([
        dbUpsert(
          db,
          schema.sync_state,
          [
            {
              ...syncState,
              state: sql`${overallState}::jsonb`,
              updated_at: sqlNow,
            },
          ],
          {
            shallowMergeJsonbColumns: ['state'], // For race condition / concurrent sync of multiple streams
            noDiffColumns: ['created_at', 'updated_at'],
          },
        ),
        // Should this happen in a transaction? doesn't seem necessary but still
        db
          .update(schema.sync_run)
          .set({
            // Should we call it currentState instead? Also do we need it on the sync_state itself?
            final_state: sql`${overallState}::jsonb`,
            metrics: sql`${metrics}::jsonb`,
          })
          .where(eq(schema.sync_run.id, syncRunId)),
      ])
      if (!ret.has_next_page) {
        break
      }
    }
  }

  try {
    // Load this from a config please...
    if (destination_schema) {
      await ensureSchema(db, destination_schema)
      console.log('[syncConnection] Ensured schema', destination_schema)
    }
    // TODO: Collect list of errors not just the last one...
    for (const stream of unified_objects) {
      try {
        await syncStream(stream)
      } catch (err) {
        errorInfo = await parseErrorInfo(err)
        // No longer authenticated error means we should be able to break out of all other streams, it's unnecessary.
        // Will need to think more about how this works for parallel read scenarios though.
        if (errorInfo?.error_type === 'USER_ERROR') {
          break
        }
        console.error('[syncConnection] Error syncing stream', stream, err)
      }
    }
  } catch (err) {
    errorInfo = await parseErrorInfo(err)
  } finally {
    await db
      .update(schema.sync_run)
      .set({
        ...errorInfo,
        completed_at: sqlNow,
        final_state: sql`${overallState}::jsonb`,
        metrics: sql`${metrics}::jsonb`,
      })
      .where(eq(schema.sync_run.id, syncRunId))
  }

  const status = errorInfo?.error_type ?? 'SUCCESS'
  await step.sendEvent('sync.completed', {
    name: 'sync.completed',
    data: {
      customer_id,
      provider_name,
      vertical,
      unified_objects,
      sync_mode,
      destination_schema,
      page_size,
      custom_objects,
      standard_objects,
      //
      request_event_id: event.id,
      run_id: syncRunId,
      metrics,
      result: status,
      error_detail: errorInfo?.error_detail,
    },
  })
  console.log(`[syncConnection] Complete ${status}`, {
    customer_id,
    provider_name,
    status,
    event_id: event.id,
    metrics,
    error: errorInfo,
    final_state: overallState,
  })
  // Return metrics to make it easier to debug in inngest
  return {syncRunId, metrics}
}

export async function triggerImmediateSync({
  event,
  step,
}: FunctionInput<'connection.created'>) {
  const data = {
    ...event.data,
    vertical: 'crm',
    unified_objects: ['account', 'contact', 'opportunity', 'lead', 'user'],
    // TODO: Dedupe with this scheduleSyncs
    destination_schema: env.DESTINATION_SCHEMA,
  } satisfies Events['sync.requested']['data']
  await step.sendEvent('sync.requested', {name: 'sync.requested', data})

  return data
}

export async function sendWebhook({event}: FunctionInput<keyof Events>) {
  if (!env.WEBHOOK_URL) {
    return false
  }

  // We shall let inngest handle the retries and backoff for now
  // Would be nice to have a openSDK for sending webhook payloads that are typed actually, after all it has
  // the exact same shape as paths.
  const res = await fetch(env.WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify(event),
    headers: {
      'content-type': 'application/json',
      // TODO: Adopt standardwebhooks and implement actual signing rather than simple secret.
      'x-webhook-secret': env.WEBHOOK_SECRET ?? '',
    },
  })
  const responseAsJson = await responseToJson(res)
  return {...responseAsJson, target: env.WEBHOOK_URL}
}

async function responseToJson(res: Response) {
  return {
    headers: Object.fromEntries(res.headers.entries()),
    status: res.status,
    statusText: res.statusText,
    body: safeJsonParse(await res.text()),
  }
}

function safeJsonParse(str: string) {
  try {
    return JSON.parse(str) as unknown
  } catch {
    return str
  }
}
