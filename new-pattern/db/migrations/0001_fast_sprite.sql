ALTER TABLE "sync_run" ADD COLUMN "customer_id" varchar GENERATED ALWAYS AS (input_event#>>'{data,customer_id}') STORED;--> statement-breakpoint
ALTER TABLE "sync_run" ADD COLUMN "provider_name" varchar GENERATED ALWAYS AS (input_event#>>'{data,provider_name}') STORED;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_customer_id_provider_name" ON "sync_run" ("customer_id","provider_name");