CREATE TABLE "module_fields" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"code" varchar(100) NOT NULL,
	"label" varchar(255),
	"field_type" varchar(50),
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "module_fields_module_code_unique" UNIQUE("module_id","code")
);
--> statement-breakpoint
CREATE TABLE "role_field_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"field_id" uuid NOT NULL,
	"is_visible" boolean DEFAULT false NOT NULL,
	"is_editable" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "role_field_permissions_unique" UNIQUE("role_id","module_id","field_id")
);
--> statement-breakpoint
CREATE TABLE "role_module_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"has_access" boolean DEFAULT false NOT NULL,
	"data_access" varchar(20) DEFAULT 'none' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "role_module_access_unique" UNIQUE("role_id","module_id")
);
--> statement-breakpoint
CREATE TABLE "role_module_permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"permission_id" uuid NOT NULL,
	"granted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	CONSTRAINT "role_module_permissions_unique" UNIQUE("role_id","module_id","permission_id")
);
--> statement-breakpoint
ALTER TABLE "module_fields" ADD CONSTRAINT "module_fields_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_field_permissions" ADD CONSTRAINT "role_field_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_field_permissions" ADD CONSTRAINT "role_field_permissions_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_field_permissions" ADD CONSTRAINT "role_field_permissions_field_id_module_fields_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."module_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_access" ADD CONSTRAINT "role_module_access_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_access" ADD CONSTRAINT "role_module_access_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_module_fields_module" ON "module_fields" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "idx_module_fields_code" ON "module_fields" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_role_field_permissions_role" ON "role_field_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_field_permissions_module" ON "role_field_permissions" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "idx_role_field_permissions_field" ON "role_field_permissions" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX "idx_role_module_access_role" ON "role_module_access" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_module_access_module" ON "role_module_access" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "idx_role_module_permissions_role" ON "role_module_permissions" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "idx_role_module_permissions_module" ON "role_module_permissions" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "idx_role_module_permissions_permission" ON "role_module_permissions" USING btree ("permission_id");