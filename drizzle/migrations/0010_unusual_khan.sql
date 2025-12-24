CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"roll_number" varchar(50) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(30),
	"course" varchar(100),
	"semester" varchar(20),
	"admission_date" date,
	"status" varchar(20) DEFAULT 'active',
	"label_ids" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "students_tenant_roll_unique" UNIQUE("tenant_id","roll_number")
);
--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_students_tenant" ON "students" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_students_status" ON "students" USING btree ("status");