import {type LeverObjectType} from '@openint/connector-lever'
import {mapper, zCast} from '@openint/vdk'
import * as unified from '../../../unifiedModels'

export const tag = mapper(zCast<LeverObjectType['tag']>(), unified.department, {
  name: 'text',
})
