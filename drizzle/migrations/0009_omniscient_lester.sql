ALTER TABLE "module_labels" DROP CONSTRAINT "module_labels_module_name_unique";--> statement-breakpoint
ALTER TABLE "module_labels" ADD COLUMN "tenant_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "module_labels" ADD CONSTRAINT "module_labels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_module_labels_tenant" ON "module_labels" USING btree ("tenant_id");--> statement-breakpoint
ALTER TABLE "module_labels" ADD CONSTRAINT "module_labels_tenant_module_name_unique" UNIQUE("tenant_id","module_id","name");