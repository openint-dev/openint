import {type revertServer} from '@openint/connector-revert'
import type {Adapter} from '../router'

export default {
  read: async ({instance}) => {
    const cursor = null
    const fields = [] as string[]
    const res = await instance.GET('/crm/contacts', {
      params: {query: {cursor, fields: fields.join(',')}},
    })
    return res.data.results.map((com) => ({
      type: 'RECORD',
      record: {stream: 'contact', data: com},
    }))
  },
} satisfies Adapter<ReturnType<(typeof revertServer)['newInstance']>>
