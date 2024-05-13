import {type LeverObjectType} from '@openint/connector-lever'
import {mapper, zCast} from '@openint/vdk'
import * as unified from '../../../unifiedModels'

export const opportunity = mapper(
  zCast<LeverObjectType['opportunity']>(),
  unified.offer,
  {
    id: (record) => String(record.id),
    created_at: 'createdAt',
    modified_at: 'updatedAt',
    // TODO: Add fields here after getting more clarity on each field .
    // application: (record) => String(record.application_id),
    // closed_at: '',
    // sent_at: 'sentAt',
    // start_date: 'starts_at',
    // status: 'status',
  },
)
