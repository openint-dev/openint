CREATE TABLE IF NOT EXISTS "customer" (
	"id" text PRIMARY KEY DEFAULT substr(md5(random()::text), 0, 25) NOT NULL,
	"created_at" timestamp(3) DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) DEFAULT now() NOT NULL,
	"name" text,
	"email" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_run" (
	"id" text PRIMARY KEY DEFAULT substr(md5(random()::text), 0, 25) NOT NULL,
	"created_at" timestamp(3) DEFAULT now(),
	"updated_at" timestamp(3) DEFAULT now(),
	"input_event" jsonb NOT NULL,
	"started_at" timestamp(3),
	"completed_at" timestamp(3),
	"initial_state" jsonb,
	"final_state" jsonb,
	"metrics" jsonb,
	"duration" interval GENERATED ALWAYS AS (completed_at - started_at) STORED,
	"status" varchar GENERATED ALWAYS AS (CASE WHEN error IS NOT NULL THEN 'ERROR' WHEN completed_at IS NOT NULL THEN 'SUCCESS' ELSE 'PENDING' END) STORED,
	"error" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_state" (
	"customer_id" text NOT NULL,
	"provider_name" text NOT NULL,
	"state" jsonb,
	"created_at" timestamp(3) DEFAULT now(),
	"updated_at" timestamp(3) DEFAULT now(),
	CONSTRAINT "sync_state_pkey" PRIMARY KEY("customer_id","provider_name")
);
