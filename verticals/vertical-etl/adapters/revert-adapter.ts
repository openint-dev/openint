import {type revertServer} from '@openint/connector-revert'
import type {Adapter} from '../router'

export default {
  read: async ({instance, input}) => {
    const contactStream = input.catalog.streams.find(
      (s) => s.stream.name === 'contact',
    )
    if (!contactStream) {
      return []
    }
    const res = await instance.GET('/crm/contacts', {
      params: {
        query: {
          cursor: input.state.stream_states.find(
            (s) => s.stream_description.name === 'contact',
          )?.stream_state?.['cursor'] as string | undefined,
          fields: contactStream.additional_fields?.join(','),
        },
      },
    })
    return res.data.results.map((com) => ({
      type: 'RECORD',
      record: {stream: 'contact', data: com},
    }))
  },
} satisfies Adapter<ReturnType<(typeof revertServer)['newInstance']>>
