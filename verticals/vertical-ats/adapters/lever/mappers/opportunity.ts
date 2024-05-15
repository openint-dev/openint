import {type LeverObjectType} from '@openint/connector-lever'
import {mapper, zCast} from '@openint/vdk'
import * as unified from '../../../unifiedModels'

export const opportunity = mapper(
  zCast<LeverObjectType['opportunity']>(),
  unified.candidate,
  {
    id: (record) => String(record.id),
    created_at: 'createdAt',
    modified_at: 'updatedAt',
    name: 'name',
    company: 'headline',
    email_addresses: (record) => record.emails?.map((e) => ({value: e})), // No concept of type in Lever emails
    phone_numbers: (record) => record.phones?.map((e) => ({value: e})),
    is_private: (record) => record.confidentiality === 'confidential',
    last_interaction_at: 'lastInteractionAt',
    tags: 'tags',
    applications: 'applications',
    locations: (record) => record.phones?.map((e) => ({value: e})),
  },
)
