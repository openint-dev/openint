import * as rxjs from 'rxjs'
import * as Rx from 'rxjs/operators'
import type {AnyEntityPayload, Id, Link} from '@openint/cdk'
import type {postgresHelpers} from '@openint/connector-postgres'
import {applyMapper} from '@openint/vdk'
import * as adapters from './adapters'

type PostgresInputPayload =
  (typeof postgresHelpers)['_types']['destinationInputEntity']

export function atsLink(ctx: {
  source: {
    id: Id['reso']
    connectorConfig: {connectorName: string}
    metadata?: unknown
  }
}): Link<AnyEntityPayload, PostgresInputPayload> {
  const categories: Record<string, boolean> =
    (ctx.source.metadata as any)?.categories ?? {}

  return Rx.mergeMap((op) => {
    if (op.type !== 'data') {
      return rxjs.of(op)
    }

    // @ts-ignore this should just work
    const adapter = adapters[ctx.source.connectorConfig.connectorName]
    if (!adapter) {
      throw new Error(
        `Unsupported ATS: ${ctx.source.connectorConfig.connectorName}`,
      )
    }

    const entityName = op.data.entityName
    if (!categories[entityName]) {
      console.warn(`Unsupported ATS entity type: ${entityName}`)
      return rxjs.EMPTY
    }

    let mapper
    switch (entityName) {
      case 'job':
        mapper = adapter.mappers.job
        break
      case 'candidate':
        mapper = adapter.mappers.candidate
        break
      case 'offer':
        mapper = adapter.mappers.offer
        break
      default:
        console.warn(`Unsupported entity type: ${entityName}`)
        return rxjs.EMPTY
    }

    if (!mapper) {
      console.warn(`No mapper found for entity type: ${entityName}`)
      return rxjs.EMPTY
    }

    const mapped = applyMapper(mapper, op.data.entity)

    return rxjs.of({
      ...op,
      data: {
        id: mapped.id,
        entityName,
        entity: {raw: op.data.entity, unified: mapped},
      },
    })
  })
}
