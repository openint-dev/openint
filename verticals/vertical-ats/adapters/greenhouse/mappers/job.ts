import {type GreenhouseObjectType} from '@openint/connector-greenhouse'
import {mapper, zCast} from '@openint/vdk'
import * as unified from '../../../unifiedModels'

export const job = mapper(zCast<GreenhouseObjectType['job']>(), unified.job, {
  id: 'id',
  created_at: 'created_at',
  modified_at: 'updated_at',
  name: 'name',
  confidential: 'confidential',
  departments: 'departments',
  offices: 'offices',
  hiring_managers: 'hiring_team.hiring_managers',
  recruiters: 'hiring_team.recruiters',
})
