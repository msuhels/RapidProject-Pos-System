CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"supplier_code" varchar(100) NOT NULL,
	"supplier_name" varchar(255) NOT NULL,
	"contact_person" varchar(255),
	"email" varchar(255),
	"phone" varchar(30),
	"address" text,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_suppliers_tenant" ON "suppliers" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_code" ON "suppliers" USING btree ("supplier_code");--> statement-breakpoint
CREATE INDEX "idx_suppliers_name" ON "suppliers" USING btree ("supplier_name");--> statement-breakpoint
CREATE INDEX "idx_suppliers_email" ON "suppliers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_suppliers_phone" ON "suppliers" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_suppliers_status" ON "suppliers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_suppliers_deleted" ON "suppliers" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "idx_suppliers_tenant_code" ON "suppliers" USING btree ("tenant_id","supplier_code");