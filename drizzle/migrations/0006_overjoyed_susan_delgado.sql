CREATE TABLE "module_labels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(20) DEFAULT '#3b82f6' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "module_labels_module_name_unique" UNIQUE("module_id","name")
);
--> statement-breakpoint
ALTER TABLE "module_labels" ADD CONSTRAINT "module_labels_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_module_labels_module" ON "module_labels" USING btree ("module_id");