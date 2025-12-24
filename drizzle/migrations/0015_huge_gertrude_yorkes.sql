CREATE TABLE "inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"sku" varchar(100),
	"location" varchar(100),
	"quantity" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'in_stock' NOT NULL,
	"label_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "product_name" varchar(255);--> statement-breakpoint
ALTER TABLE "carts" ADD COLUMN "product_price" varchar(50);--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_inventory_tenant" ON "inventory" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_product" ON "inventory" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_inventory_status" ON "inventory" USING btree ("status");