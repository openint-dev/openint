-- TODO: Create these generated columns automatically during sync


ALTER TABLE supaglue.crm_users ADD _name VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'name') STORED;

ALTER TABLE supaglue.crm_users ADD _email VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'email') STORED;

-- 

ALTER TABLE supaglue.crm_accounts ADD _name VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'name') STORED;

ALTER TABLE supaglue.crm_accounts ADD _website VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'website') STORED;

-- 

ALTER TABLE supaglue.crm_opportunities ADD _name VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'name') STORED;

ALTER TABLE supaglue.crm_opportunities ADD _amount VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'amount') STORED;
  
ALTER TABLE supaglue.crm_opportunities ADD _owner_id VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'owner_id') STORED;
  
ALTER TABLE supaglue.crm_opportunities ADD _account_id VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'account_id') STORED;
  
ALTER TABLE supaglue.crm_opportunities ADD _stage VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'stage') STORED;
  
ALTER TABLE supaglue.crm_opportunities ADD _close_date VARCHAR GENERATED ALWAYS AS 
  (_supaglue_unified_data->>'close_date') STORED;
  

-- Migration
ALTER TABLE supaglue.crm_users RENAME COLUMN name to __name;
ALTER TABLE supaglue.crm_users RENAME COLUMN email to __email;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN name to __name;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN website to __website;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN name to __name;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN amount to __amount;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN owner_id to __owner_id;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN account_id to __account_id;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN stage to __stage;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN close_date to __close_date;

ALTER TABLE supaglue.crm_users RENAME COLUMN _name to name;
ALTER TABLE supaglue.crm_users RENAME COLUMN _email to email;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN _name to name;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN _website to website;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN _name to name;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN _amount to amount;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN _owner_id to owner_id;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN _account_id to account_id;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN _stage to stage;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN _close_date to close_date;


-- Deprecate old fields

ALTER TABLE supaglue.crm_users RENAME COLUMN is_active TO __is_active;
ALTER TABLE supaglue.crm_leads RENAME COLUMN lead_source TO __lead_source;
ALTER TABLE supaglue.crm_leads RENAME COLUMN title TO __title;
ALTER TABLE supaglue.crm_leads RENAME COLUMN company TO __company;
ALTER TABLE supaglue.crm_leads RENAME COLUMN first_name TO __first_name;
ALTER TABLE supaglue.crm_leads RENAME COLUMN last_name TO __last_name;
ALTER TABLE supaglue.crm_leads RENAME COLUMN addresses TO __addresses;
ALTER TABLE supaglue.crm_leads RENAME COLUMN email_addresses TO __email_addresses;
ALTER TABLE supaglue.crm_leads RENAME COLUMN phone_numbers TO __phone_numbers;
ALTER TABLE supaglue.crm_leads RENAME COLUMN converted_date TO __converted_date;
ALTER TABLE supaglue.crm_leads RENAME COLUMN converted_contact_id TO __converted_contact_id;
ALTER TABLE supaglue.crm_leads RENAME COLUMN converted_account_id TO __converted_account_id;
ALTER TABLE supaglue.crm_leads RENAME COLUMN owner_id TO __owner_id;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN description TO __description;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN status TO __status;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN pipeline TO __pipeline;
ALTER TABLE supaglue.crm_opportunities RENAME COLUMN last_activity_at TO __last_activity_at;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN description TO __description;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN industry TO __industry;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN number_of_employees TO __number_of_employees;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN addresses TO __addresses;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN phone_numbers TO __phone_numbers;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN last_activity_at TO __last_activity_at;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN lifecycle_stage TO __lifecycle_stage;
ALTER TABLE supaglue.crm_accounts RENAME COLUMN owner_id TO __owner_id;
ALTER TABLE supaglue.crm_contacts RENAME COLUMN first_name TO __first_name;
ALTER TABLE supaglue.crm_contacts RENAME COLUMN last_name TO __last_name;
ALTER TABLE supaglue.crm_contacts RENAME COLUMN addresses TO __addresses;
ALTER TABLE supaglue.crm_contacts RENAME COLUMN email_addresses TO __email_addresses;
ALTER TABLE supaglue.crm_contacts RENAME COLUMN phone_numbers TO __phone_numbers;
ALTER TABLE supaglue.crm_contacts RENAME COLUMN lifecycle_stage TO __lifecycle_stage;
ALTER TABLE supaglue.crm_contacts RENAME COLUMN account_id TO __account_id;
ALTER TABLE supaglue.crm_contacts RENAME COLUMN owner_id TO __owner_id;
ALTER TABLE supaglue.crm_contacts RENAME COLUMN last_activity_at TO __last_activity_at;