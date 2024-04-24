import {type GreenhouseObjectType} from '@openint/connector-greenhouse'
import {mapper, zCast} from '@openint/vdk'
import * as unified from '../../unifiedModels'

export const department = mapper(
  zCast<GreenhouseObjectType['department']>(),
  unified.department,
  {
    id: 'id',
    // NOTE: Greenhouse doesn't support the timestamp fields
    // created_at: '',
    // modified_at: '',
    name: 'name',
  },
)
