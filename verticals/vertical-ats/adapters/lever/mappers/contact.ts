import {type LeverObjectType} from '@openint/connector-lever'
import {mapper, zCast} from '@openint/vdk'
import * as unified from '../../../unifiedModels'

export const contact = mapper(
  zCast<LeverObjectType['contact']>(),
  unified.candidate,
  {
    id: (record) => String(record.id),
    // TODO: Add fields here after getting more clarity on each field .
    // created_at: 'created_at',
    // modified_at: 'updated_at',
    name: 'name',
    // last_name: 'last_name',
    // company: 'company',
    title: 'headline',
    // last_interaction_at: 'last_activity',
    is_private: 'isAnonymized',
    // can_email: 'can_email',
    locations: 'location',
    phone_numbers: 'phones',
    email_addresses: 'emails',
    // tags: 'tags',
    // applications: 'applications',
    // attachments: 'attachments',
  },
)
