import {z} from '@openint/vdk'

export const offer = z.object({
  id: z.string(),
  remote_id: z.string(),
  created_at: z.string(),
  modified_at: z.string(),
  application: z.string(),
  closed_at: z.string(),
  sent_at: z.string(),
  start_date: z.string(),
  status: z.string(),
  raw_data: z.record(z.unknown()).optional(),
})

export const department = z.object({
  id: z.string(),
  remote_id: z.string(),
  created_at: z.string().nullish(),
  modified_at: z.string().nullish(),
  name: z.string(),
  parent_id: z.string().nullish(),
  parent_department_external_id: z.string().nullish(),
  child_ids: z.array(z.string().nullish()),
  child_department_external_ids: z.array(z.string().nullish()),
  raw_data: z.record(z.unknown()).optional(),
})

export const job = z.object({
  id: z.string(),
  remote_id: z.string(),
  created_at: z.string(),
  modified_at: z.string(),
  name: z.string(),
  confidential: z.boolean(),
  departments: z.array(department),
  offices: z.array(z.record(z.unknown())),
  hiring_managers: z.array(z.record(z.unknown())),
  recruiters: z.array(z.record(z.unknown())),
  raw_data: z.record(z.unknown()).optional(),
})

const phoneNumberSchema = z.object({
  value: z.string().nullish(),
  phone_number_type: z.string().nullish(),
})

const emailAddressSchema = z.object({
  value: z.string().email().nullish(),
  email_address_type: z.string().nullish(),
})

export const candidate = z.object({
  id: z.string(),
  remote_id: z.string(),
  created_at: z.string(),
  modified_at: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  company: z.string().nullable(),
  title: z.string().nullable(),
  last_interaction_at: z.string(),
  is_private: z.boolean(),
  can_email: z.boolean(),
  locations: z.array(z.unknown()),
  phone_numbers: z.array(phoneNumberSchema),
  email_addresses: z.array(emailAddressSchema),
  tags: z.array(z.string()),
  applications: z.array(z.unknown()),
  attachments: z.array(z.unknown()),
  raw_data: z.record(z.unknown()).optional(),
})
