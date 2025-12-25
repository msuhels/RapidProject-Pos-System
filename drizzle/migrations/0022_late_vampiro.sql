CREATE TABLE "stock_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"adjustment_type" varchar(50) NOT NULL,
	"quantity" numeric(15, 2) NOT NULL,
	"previous_quantity" numeric(15, 2) NOT NULL,
	"new_quantity" numeric(15, 2) NOT NULL,
	"reason" varchar(100) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"movement_type" varchar(50) NOT NULL,
	"quantity" numeric(15, 2) NOT NULL,
	"previous_quantity" numeric(15, 2) NOT NULL,
	"new_quantity" numeric(15, 2) NOT NULL,
	"reason" varchar(100),
	"reference_id" uuid,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tax_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_amount" numeric(15, 2);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount_type" varchar(50);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "is_voided" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "voided_by" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "voided_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_tenant" ON "stock_adjustments" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_product" ON "stock_adjustments" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_type" ON "stock_adjustments" USING btree ("adjustment_type");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_reason" ON "stock_adjustments" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "idx_stock_adjustments_date" ON "stock_adjustments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_tenant" ON "stock_movements" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_product" ON "stock_movements" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_type" ON "stock_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_reason" ON "stock_movements" USING btree ("reason");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_reference" ON "stock_movements" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "idx_stock_movements_date" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_orders_voided" ON "orders" USING btree ("is_voided");