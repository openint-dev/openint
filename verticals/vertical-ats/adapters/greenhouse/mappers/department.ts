import {type GreenhouseObjectType} from '@openint/connector-greenhouse'
import {mapper, zCast} from '@openint/vdk'
import * as unified from '../../../unifiedModels'

export const department = mapper(
  zCast<GreenhouseObjectType['department']>(),
  unified.department,
  {
    id: (record) => String(record.id),
    remote_id: (record) => String(record.id),
    // NOTE: Greenhouse doesn't support the timestamp fields
    // created_at: '',
    // modified_at: '',
    name: 'name',
    parent_id: 'parent_id',
    parent_department_external_id: 'parent_department_external_ids',
    child_ids: 'child_ids',
    child_department_external_ids: 'child_department_external_ids',
    raw_data: (record) => record,
  },
)
