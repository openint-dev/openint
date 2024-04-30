import {type GreenhouseObjectType} from '@openint/connector-greenhouse'
import {mapper, zCast} from '@openint/vdk'
import * as unified from '../../../unifiedModels'

export const offer = mapper(
  zCast<GreenhouseObjectType['offer']>(),
  unified.offer,
  {
    id: (record) => String(record.id),
    remote_id: (record) => String(record.id),
    created_at: 'created_at',
    modified_at: 'updated_at',
    application: (record) => String(record.application_id),
    closed_at: 'opening.closed_at',
    sent_at: 'sent_at',
    start_date: 'starts_at',
    status: 'status',
  },
)
