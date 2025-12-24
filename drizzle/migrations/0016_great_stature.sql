ALTER TABLE "products" ADD COLUMN "sku" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "location" varchar(100);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "status" varchar(50) DEFAULT 'in_stock' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_products_status" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_products_location" ON "products" USING btree ("location");