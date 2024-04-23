ALTER TABLE "sync_run" ADD COLUMN "error_type" varchar;

ALTER TABLE "sync_run" DROP COLUMN "status";
ALTER TABLE "sync_run" ADD COLUMN "status" varchar GENERATED ALWAYS AS 
  (CASE WHEN error_type IS NOT NULL THEN error_type 
        WHEN completed_at IS NOT NULL THEN 'SUCCESS' 
        ELSE 'PENDING' END) STORED;--> statement-breakpoint
