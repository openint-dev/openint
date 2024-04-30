import {type GreenhouseObjectType} from '@openint/connector-greenhouse'
import {mapper, zCast} from '@openint/vdk'
import * as unified from '../../../unifiedModels'

export const candidate = mapper(
  zCast<GreenhouseObjectType['candidate']>(),
  unified.candidate,
  {
    id: (record) => String(record.id),
    remote_id: (record) => String(record.id),
    created_at: 'created_at',
    modified_at: 'updated_at',
    first_name: 'first_name',
    last_name: 'last_name',
    company: 'company',
    title: 'title',
    last_interaction_at: 'last_activity',
    is_private: 'is_private',
    can_email: 'can_email',
    locations: 'addresses',
    phone_numbers: 'phone_numbers',
    email_addresses: 'email_addresses',
    tags: 'tags',
    applications: 'applications',
    attachments: 'attachments',
    raw_data: (record) => record,
  },
)
