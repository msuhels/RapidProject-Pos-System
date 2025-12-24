CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"price" varchar(50) NOT NULL,
	"quantity" varchar(50) NOT NULL,
	"image" text,
	"category" varchar(100),
	"label_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_products_tenant" ON "products" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_products_category" ON "products" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_products_name" ON "products" USING btree ("name");