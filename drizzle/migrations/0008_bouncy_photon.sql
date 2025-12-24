ALTER TABLE "notes" DROP CONSTRAINT "notes_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "status" varchar(50) DEFAULT 'active';--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "is_pinned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "label_ids" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "custom_fields" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "notes" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notes_tenant" ON "notes" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_notes_status" ON "notes" USING btree ("status");--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "notes" DROP COLUMN "user_id";