CREATE TABLE "system_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"autoload" boolean DEFAULT true NOT NULL,
	"data_type" text DEFAULT 'string',
	"description" text,
	"is_sensitive" boolean DEFAULT false NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE INDEX "idx_system_settings_category" ON "system_settings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_system_settings_autoload" ON "system_settings" USING btree ("autoload");--> statement-breakpoint
CREATE INDEX "idx_system_settings_category_subcategory" ON "system_settings" USING btree ("category","subcategory");