import {createAppHandler} from '@openint/api'
import {loopbackLink} from '@openint/loopback-link'
import {initOpenIntSDK} from '@openint/sdk'

const openint = initOpenIntSDK({
  links: [loopbackLink(), createAppHandler()], // This bypasses the entire server-stack! And handles request directly in memory for easy testing.
  baseUrl: process.env['_VENICE_API_HOST'],
  headers: {
    'x-apikey': process.env['_VENICE_API_KEY'],
    'x-resource-id': process.env['_XERO_RESOURCE_ID'],

    // resourceId: process.env['_QBO_RESOURCE_ID'],
  },
})

void openint.GET('/verticals/banking/category').then((r) => {
  console.log(r.data)
})

// void venice
//   .POST('/core/resource/{id}/source_sync', {
//     params: {path: {id: process.env['_APOLLO_RESOURCE_ID']!}},
//     body: {streams: {contact: true}},
//   })
//   .then((r) => {
//     console.log(r.data)
//   })
