import {z} from '@openint/vdk'

export const offer = z.object({
  id: z.string().uuid(),
  created_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  modified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  application: z.string().uuid(),
  closed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  sent_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  status: z.string(),
})

export const job = z.object({
  id: z.string().uuid(),
  created_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  modified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  name: z.string(),
  confidential: z.boolean(),
  departments: z.array(z.string().uuid()),
  offices: z.array(z.string().uuid()),
  hiring_managers: z.array(z.string().uuid()),
  recruiters: z.array(z.string().uuid()),
})

const phoneNumberSchema = z.object({
  value: z.string(),
  phone_number_type: z.string(),
})

const emailAddressSchema = z.object({
  value: z.string().email(),
  email_address_type: z.string(),
})

export const candidate = z.object({
  id: z.string().uuid(),
  created_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  modified_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  first_name: z.string(),
  last_name: z.string(),
  company: z.string(),
  title: z.string(),
  last_interaction_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  is_private: z.boolean(),
  can_email: z.boolean(),
  locations: z.array(z.string()),
  phone_numbers: z.array(phoneNumberSchema),
  email_addresses: z.array(emailAddressSchema),
  tags: z.array(z.string()),
  applications: z.array(z.string().uuid()),
  attachments: z.array(z.string().uuid()),
})

export const department = z.object({
  id: z.string().uuid(),
  created_at: z.string().nullish(),
  modified_at: z.string().nullish(),
  name: z.string(),
})
