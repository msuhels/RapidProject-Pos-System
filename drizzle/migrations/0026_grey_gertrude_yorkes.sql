ALTER TABLE "products" ADD COLUMN "supplier_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_products_supplier" ON "products" USING btree ("supplier_id");--> statement-breakpoint
ALTER TABLE "suppliers" DROP COLUMN "contact_person";