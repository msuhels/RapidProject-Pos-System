CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member',
	"hourly_rate" numeric(10, 2),
	"can_edit" boolean DEFAULT false,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	CONSTRAINT "project_members_project_user_unique" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"due_date" date,
	"amount" numeric(15, 2),
	"status" varchar(20) DEFAULT 'pending',
	"completed_at" timestamp,
	"sort_order" integer DEFAULT 0,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"project_code" varchar(50),
	"title" varchar(255) NOT NULL,
	"description" text,
	"project_type" varchar(50),
	"status" varchar(50) DEFAULT 'open',
	"priority" varchar(20) DEFAULT 'medium',
	"start_date" date,
	"deadline" date,
	"completed_at" timestamp,
	"estimated_hours" numeric(10, 2),
	"actual_hours" numeric(10, 2) DEFAULT '0',
	"budget_amount" numeric(15, 2),
	"spent_amount" numeric(15, 2) DEFAULT '0',
	"price" numeric(15, 2),
	"currency" varchar(10) DEFAULT 'USD',
	"progress_percentage" integer DEFAULT 0,
	"billing_type" varchar(20) DEFAULT 'fixed',
	"is_billable" boolean DEFAULT true,
	"is_template" boolean DEFAULT false,
	"labels" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "projects_project_code_unique" UNIQUE("project_code")
);
--> statement-breakpoint
CREATE TABLE "task_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"is_completed" boolean DEFAULT false,
	"completed_by" uuid,
	"completed_at" timestamp,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "task_collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now(),
	CONSTRAINT "task_collaborators_task_user_unique" UNIQUE("task_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"task_code" varchar(50),
	"title" varchar(255) NOT NULL,
	"description" text,
	"project_id" uuid,
	"milestone_id" uuid,
	"parent_task_id" uuid,
	"assigned_to" uuid,
	"status" varchar(50) DEFAULT 'to_do',
	"priority" varchar(20) DEFAULT 'medium',
	"points" integer,
	"start_date" date,
	"deadline" date,
	"completed_at" timestamp,
	"estimated_hours" numeric(10, 2),
	"actual_hours" numeric(10, 2) DEFAULT '0',
	"is_recurring" boolean DEFAULT false,
	"recurring_config" jsonb,
	"is_billable" boolean DEFAULT true,
	"labels" jsonb DEFAULT '[]'::jsonb,
	"custom_fields" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0,
	"created_by" uuid NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tasks_task_code_unique" UNIQUE("task_code")
);
--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_checklist_items" ADD CONSTRAINT "task_checklist_items_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_checklist_items" ADD CONSTRAINT "task_checklist_items_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_collaborators" ADD CONSTRAINT "task_collaborators_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_collaborators" ADD CONSTRAINT "task_collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_milestone_id_project_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."project_milestones"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_parent_task_id_fkey" FOREIGN KEY ("parent_task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_project_members_tenant" ON "project_members" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_project_milestones_tenant" ON "project_milestones" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_project_milestones_project" ON "project_milestones" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_projects_tenant" ON "projects" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_task_checklist_task" ON "task_checklist_items" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_task_collaborators_task" ON "task_collaborators" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_tenant" ON "tasks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_status" ON "tasks" USING btree ("status");